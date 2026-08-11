// supabase/functions/ai-appeal-review/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    // ОТРИМУЄМО appeal_id
    const { appeal_id } = await req.json();
    console.log("📥 Отримано запит на обробку апеляції:", appeal_id);
    
    if (!appeal_id) {
      return new Response(JSON.stringify({ error: "appeal_id required" }), { status: 400 });
    }

    // ============================================================
    // 1. ОТРИМУЄМО АПЕЛЯЦІЮ - ТІЛЬКИ ТІ ПОЛЯ, ЩО Є!
    // ============================================================
    // ВИКОРИСТОВУЄМО ПРЯМИЙ ЗАПИТ БЕЗ JOIN, ЩОБ НЕ БУЛО ПОМИЛОК
    const { data: appeal, error } = await supabase
      .from("appeals")
      .select("*")
      .eq("id", appeal_id)
      .single();

    if (error || !appeal) {
      console.error("❌ Апеляцію не знайдено:", error);
      return new Response(
        JSON.stringify({ 
          error: "Appeal not found", 
          details: error?.message,
          appeal_id: appeal_id 
        }), 
        { status: 404 }
      );
    }

    console.log("✅ Апеляцію знайдено:", appeal.id);
    console.log("📊 Дані апеляції:", JSON.stringify(appeal, null, 2));

    if (appeal.status !== "pending") {
      return new Response(
        JSON.stringify({ 
          message: "Already processed", 
          status: appeal.status,
          appeal_id: appeal.id 
        }), 
        { status: 200 }
      );
    }

    // ============================================================
    // 2. ОТРИМУЄМО ДАНІ ПРО КОРИСТУВАЧА
    // ============================================================
    const userId = appeal.user_id;
    
    // ОТРИМУЄМО КОРИСТУВАЧА
    const { data: user } = await supabase
      .from("users")
      .select("id, full_name, email, role, is_banned, reg_ip")
      .eq("id", userId)
      .single();

    // ОТРИМУЄМО ІСТОРІЮ БАНІВ
    const { data: banHistory } = await supabase
      .from("ai_actions_log")
      .select("*")
      .eq("target_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    // ============================================================
    // 3. ФОРМУЄМО КОНТЕКСТ ДЛЯ ШІ
    // ============================================================
    const context = `
АПЕЛЯЦІЯ #${appeal.id}
Користувач: ${user?.full_name || "Невідомий"} (${user?.email || "без email"})
Причина бана: ${appeal.ban_reason || "Не вказано"}
Опис: ${appeal.description || "Немає опису"}
Дата: ${new Date(appeal.created_at).toLocaleString("uk-UA")}
Статус: ${appeal.status}

ІНФО ПРО КОРИСТУВАЧА:
- Роль: ${user?.role || "user"}
- Забанений: ${user?.is_banned ? "Так" : "Ні"}
- IP: ${user?.reg_ip || "Невідомо"}

ІСТОРІЯ БАНІВ (${banHistory?.length || 0}):
${banHistory?.map(b => `- ${new Date(b.created_at).toLocaleString("uk-UA")}: ${b.ai_reasoning || "Без причини"}`).join("\n") || "Немає"}

ТИ МОДЕРАТОР. ПРИЙМИ РІШЕННЯ:
1. Схвалити апеляцію - розбанити користувача
2. Відхилити апеляцію - залишити бан

ВІДПОВІДАЙ ТІЛЬКИ JSON:
{
  "decision": "approve|reject",
  "reason": "коротка причина до 100 символів",
  "public_reason": "причина для користувача"
}`;

    // ============================================================
    // 4. ВИКЛИК ШІ
    // ============================================================
    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) {
      console.error("❌ Немає GROQ_API_KEY");
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY not set" }), 
        { status: 500 }
      );
    }

    console.log("🤖 Виклик Groq...");
    
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Ти суворий модератор. Відповідай тільки JSON." },
          { role: "user", content: context }
        ],
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: "json_object" }
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("❌ Groq API помилка:", errorText);
      return new Response(
        JSON.stringify({ error: "Groq API error", details: errorText }), 
        { status: 500 }
      );
    }

    const result = await groqResponse.json();
    const decision = JSON.parse(result.choices[0].message.content);
    
    console.log("✅ ШІ прийняв рішення:", decision);

    // ============================================================
    // 5. ВИКОНАННЯ РІШЕННЯ
    // ============================================================
    let actionResult = "";
    let newStatus = "pending";

    if (decision.decision === "approve") {
      newStatus = "approved";
      actionResult = "Апеляцію схвалено, користувача розблоковано";
      
      // РОЗБАНЮЄМО КОРИСТУВАЧА
      await supabase
        .from("users")
        .update({ 
          is_banned: false, 
          ban_reason: null, 
          banned_until: null 
        })
        .eq("id", userId);
      
      await supabase.from("ai_actions_log").insert({
        action_type: "appeal_review",
        target_user_id: userId,
        ai_reasoning: `[Апеляція #${appeal.id}] СХВАЛЕНО: ${decision.reason}`,
        action_taken: {
          appeal_id: appeal.id,
          decision: "approve",
          result: actionResult,
          reason: decision.reason
        }
      });

    } else if (decision.decision === "reject") {
      newStatus = "rejected";
      actionResult = "Апеляцію відхилено";
      
      await supabase.from("ai_actions_log").insert({
        action_type: "appeal_review",
        target_user_id: userId,
        ai_reasoning: `[Апеляція #${appeal.id}] ВІДХИЛЕНО: ${decision.reason}`,
        action_taken: {
          appeal_id: appeal.id,
          decision: "reject",
          result: actionResult,
          reason: decision.reason
        }
      });
    }

    // ============================================================
    // 6. ОНОВЛЮЄМО АПЕЛЯЦІЮ
    // ============================================================
    await supabase
      .from("appeals")
      .update({
        status: newStatus,
        resolution: decision.public_reason || decision.reason || actionResult,
        resolved_at: new Date().toISOString()
      })
      .eq("id", appeal.id);

    // ============================================================
    // 7. СПОВІЩЕННЯ КОРИСТУВАЧЕВІ
    // ============================================================
    const statusLabels = {
      'approved': '✅ Схвалено',
      'rejected': '❌ Відхилено'
    };

    await supabase.from("notifications").insert({
      user_id: appeal.user_id,
      title: `📋 Апеляція #${appeal.id.substring(0, 8)}`,
      message: `Статус: ${statusLabels[newStatus] || newStatus}. ${decision.public_reason || decision.reason}`,
      type: "appeal_result"
    });

    // ЯКЩО РОЗБЛОКУВАЛИ - СПОВІЩАЄМО
    if (newStatus === "approved") {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "✅ Вас розблоковано!",
        message: `Вашу апеляцію схвалено. ${decision.public_reason || decision.reason}`,
        type: "system"
      });
    }

    // ============================================================
    // 8. ВІДПОВІДЬ
    // ============================================================
    return new Response(JSON.stringify({
      success: true,
      appeal_id: appeal.id,
      status: newStatus,
      decision: decision.decision,
      result: actionResult,
      reasoning: decision.reason,
      public_reason: decision.public_reason || decision.reason
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    console.error("❌ Критична помилка:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
});