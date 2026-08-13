// supabase/functions/ai-review-report/index.ts
//
// Запускається по розкладу (pg_cron / зовнішній cron).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const CRON_SECRET = Deno.env.get("CRON_SECRET");
const GRACE_PERIOD_MIN = 15;

function isAuthorized(req: Request): boolean {
  if (!CRON_SECRET) return false;
  return req.headers.get("x-cron-secret") === CRON_SECRET;
}

async function callGroq(system: string, user: string, tool: any) {
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("GROQ_API_KEY")}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      tools: [{ type: "function", function: tool }],
      tool_choice: { type: "function", function: { name: tool.name } },
    }),
  });
  const data = await resp.json();
  const call = data.choices?.[0]?.message?.tool_calls?.[0];
  return call ? JSON.parse(call.function.arguments) : null;
}

Deno.serve(async (req) => {
  if (!isAuthorized(req)) {
    return new Response("unauthorized", { status: 401 });
  }

  const { data: settings } = await supabase
    .from("system_settings").select("value").eq("key", "ai_report_review_enabled").single();
  if (settings?.value !== "true") return new Response("skipped", { status: 200 });

  const graceThreshold = new Date(Date.now() - GRACE_PERIOD_MIN * 60000).toISOString();

  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("status", "pending")
    .is("assigned_to", null)
    .lte("created_at", graceThreshold);

  for (const report of reports ?? []) {
    if (!report.target_user_id) {
      continue;
    }

    const [{ data: target }, { data: recentMsgs }, { data: orgs }, { count: priorReportsCount }] =
      await Promise.all([
        supabase.from("users").select("*").eq("id", report.target_user_id).maybeSingle(),
        supabase.from("org_chat_messages").select("message, created_at")
          .eq("user_id", report.target_user_id).order("created_at", { ascending: false }).limit(30),
        supabase.from("org_members").select("organization_id, is_leader").eq("user_id", report.target_user_id),
        supabase.from("reports").select("id", { count: "exact", head: true })
          .eq("target_user_id", report.target_user_id),
      ]);

    if (!target) continue;

    const context = `
Скарга: ${report.reason} — ${report.description ?? ""}
Профіль цілі: ${target.full_name ?? "?"} (${target.email ?? "?"}), роль: ${target.role}, вже забанений: ${target.is_banned}
Організації цілі: ${(orgs ?? []).map((o) => `${o.organization_id}${o.is_leader ? " (лідер)" : ""}`).join(", ") || "немає"}
Останні повідомлення (до 30): ${(recentMsgs ?? []).map((m) => m.message).join(" | ") || "немає"}
IP (reg/last): ${target.reg_ip ?? "?"} / ${target.last_ip ?? "?"}
Кількість скарг на цього користувача всього: ${priorReportsCount ?? "невідомо"}
`.trim();

    const decision = await callGroq(
      "Ти модератор Typebiz, що розглядає скарги. Проаналізуй контекст і вирішуй: скарга обґрунтована чи ні. " +
        "Якщо обґрунтована - запропонуй дію: warn, ban, dismiss. " +
        "Якщо роль цілі admin, moderator або owner - завжди dismiss і рекомендуй ручний розгляд людиною.",
      context,
      {
        name: "report_decision",
        description: "Рішення по скарзі",
        parameters: {
          type: "object",
          properties: {
            valid: { type: "boolean" },
            action: { type: "string", enum: ["warn", "ban", "dismiss"] },
            ban_days: { type: "integer" },
            reasoning: { type: "string" },
          },
          required: ["valid", "action", "reasoning"],
        },
      }
    );
    if (!decision) continue;

    const targetIsStaff = ["admin", "moderator", "owner"].includes(target.role);

    if (decision.action === "ban" && !targetIsStaff) {
      const banDays = Math.min(Math.max(decision.ban_days ?? 1, 1), 3);
      const banUntil = new Date(Date.now() + banDays * 86400000).toISOString();
      await supabase.from("users")
        .update({ is_banned: true, ban_reason: `[ШІ, за скаргою] ${decision.reasoning}`, banned_until: banUntil, banned_at: new Date().toISOString() })
        .eq("id", report.target_user_id);
    }

    await supabase.from("reports")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", report.id);

    await supabase.from("ai_actions_log").insert({
      action_type: "report_review",
      target_user_id: report.target_user_id,
      related_report_id: report.id,
      ai_reasoning: decision.reasoning,
      action_taken: {
        valid: decision.valid,
        action: targetIsStaff ? "dismiss (target is staff)" : decision.action,
        ban_days: decision.ban_days,
      },
    });
  }
  return new Response("done", { status: 200 });
});