// supabase/functions/ai-support-agent/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function isAuthorized(req: Request): boolean {
  return true; // ДОЗВОЛЯЄМО ВСІ ЗАПИТИ
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
  return call ? JSON.parse(call.function.arguments) : null;
}

Deno.serve(async (req) => {
  if (!isAuthorized(req)) {
    return new Response("unauthorized", { status: 401 });
  }

  const { data: settings } = await supabase
    .from("system_settings").select("value").eq("key", "ai_support_enabled").single();
  if (settings?.value !== "true") return new Response("skipped", { status: 200 });

  const { data: tickets } = await supabase
    .from("support_tickets").select("*").eq("status", "open");

  for (const ticket of tickets ?? []) {
    const { data: messages } = await supabase
      .from("support_messages").select("sender_type").eq("ticket_id", ticket.id);
    const staffReplied = (messages ?? []).some((m) =>
      ["admin", "moderator", "owner"].includes(m.sender_type)
    );
    const aiAlreadyReplied = (messages ?? []).some((m) => m.sender_type === "ai");
    if (staffReplied || aiAlreadyReplied) continue;

    const decision = await callGroq(
      "Ти агент підтримки Typebiz. Відповідай ввічливо, українською, по суті. " +
        "Якщо питання складне, юридичне або потребує рішення людини - постав needs_human=true і напиши, що передаєш людині, не обіцяй нічого від імені компанії.",
      `Тема: ${ticket.subject}\nТип: ${ticket.type}\nПовідомлення: ${ticket.message}`,
      {
        name: "support_reply",
        description: "Відповідь підтримки",
        parameters: {
          type: "object",
          properties: {
            reply: { type: "string" },
            needs_human: { type: "boolean" },
          },
          required: ["reply", "needs_human"],
        },
      }
    );
    if (!decision) continue;

    await supabase.from("support_messages").insert({
      ticket_id: ticket.id,
      sender_type: "ai",
      message: decision.reply,
      created_at: new Date().toISOString(),
    });

    if (decision.needs_human) {
      await supabase.from("support_tickets").update({ priority: "high" }).eq("id", ticket.id);
    }

    await supabase.from("ai_actions_log").insert({
      action_type: "support_reply",
      related_ticket_id: ticket.id,
      ai_reasoning: decision.reply,
      action_taken: { needs_human: decision.needs_human },
    });
  }
  return new Response("done", { status: 200 });
});