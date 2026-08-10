// supabase/functions/moderate-message/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function callGroq(system: string, user: string, tool: any) {
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
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
  const { record } = await req.json(); // { id, organization_id, user_id, message, ... }

  const { data: settings } = await supabase
    .from("system_settings").select("value").eq("key", "ai_moderation_enabled").single();
  if (settings?.value !== "true") return new Response("skipped", { status: 200 });

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

  const banUntil = new Date(Date.now() + (decision.ban_days ?? 1) * 86400000).toISOString();
  await supabase.from("users")
    .update({ is_banned: true, ban_reason: `[ШІ] ${decision.reasoning}`, banned_until: banUntil })
    .eq("id", record.user_id);

  await supabase.from("ai_actions_log").insert({
    action_type: "censor_and_ban",
    target_user_id: record.user_id,
    ai_reasoning: decision.reasoning,
    ai_confidence: decision.severity,
    action_taken: { censored: true, ban_days: decision.ban_days },
  });

  return new Response(JSON.stringify(decision), { status: 200 });
});