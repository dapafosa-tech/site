// supabase/functions/moderate-message/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ПРИБИРАЄМО ПЕРЕВІРКУ СЕКРЕТУ
function isAuthorized(req: Request): boolean {
  return true; // ДОЗВОЛЯЄМО ВСІ ЗАПИТИ (або перевіряємо токен)
}

async function callGroq(system: string, user: string, tool: any) {
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      tools: [{ type: "function", function: tool }],
      tool_choice: { type: "function", function: { name: tool.name } },
    }),
  });
  const data = await resp.json();
  const call = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) return null;
  return JSON.parse(call.function.arguments);
}

Deno.serve(async (req) => {
  if (!isAuthorized(req)) {
    return new Response("unauthorized", { status: 401 });
  }

  let record: any;
  try {
    const body = await req.json();
    record = body.record;
  } catch {
    return new Response("bad request", { status: 400 });
  }
  
  if (!record?.id || !record?.user_id || typeof record.message !== "string") {
    return new Response("bad payload", { status: 400 });
  }

  const { data: settings } = await supabase
    .from("system_settings").select("value").eq("key", "ai_moderation_enabled").single();
  if (settings?.value !== "true") return new Response("skipped", { status: 200 });

  const { data: author } = await supabase
    .from("users").select("role, is_banned").eq("id", record.user_id).maybeSingle();
  if (author && ["admin", "moderator", "owner"].includes(author.role)) {
    return new Response("staff message, skipped", { status: 200 });
  }
  if (!record.message.trim()) return new Response("empty message", { status: 200 });

  const { data: bannedWords } = await supabase.from("banned_words").select("word");
  const wordList = (bannedWords ?? []).map((w) => w.word).join(", ");

  const decision = await callGroq(
    "Ти модератор чату Typebiz. Аналізуй повідомлення на заборонену лексику, образи, погрози, спам. " +
      `Орієнтир забороненого: ${wordList}. Якщо є порушення - дай цензуровану версію (заборонені слова заміни на ***) і строк бану 1-3 дні залежно від тяжкості.`,
    `Повідомлення: "${record.message}"`,
    {
      name: "moderation_decision",
      description: "Рішення модерації повідомлення",
      parameters: {
        type: "object",
        properties: {
          contains_violation: { type: "boolean" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          censored_text: { type: "string" },
          ban_days: { type: "integer", enum: [1, 2, 3] },
          reasoning: { type: "string" },
        },
        required: ["contains_violation", "reasoning"],
      },
    }
  );

  if (!decision?.contains_violation) return new Response("no violation", { status: 200 });

  await supabase.from("org_chat_messages")
    .update({ message: decision.censored_text, is_censored: true, censored_at: new Date().toISOString() })
    .eq("id", record.id);

  if (!author?.is_banned) {
    const banUntil = new Date(Date.now() + (decision.ban_days ?? 1) * 86400000).toISOString();
    await supabase.from("users")
      .update({ is_banned: true, ban_reason: `[ШІ] ${decision.reasoning}`, banned_until: banUntil })
      .eq("id", record.user_id);
  }

  await supabase.from("ai_actions_log").insert({
    action_type: "censor_and_ban",
    target_user_id: record.user_id,
    ai_reasoning: decision.reasoning,
    ai_confidence: decision.severity,
    action_taken: { censored: true, ban_days: decision.ban_days, already_banned: !!author?.is_banned },
  });

  return new Response(JSON.stringify(decision), { status: 200 });
});