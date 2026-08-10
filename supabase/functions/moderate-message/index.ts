// supabase/functions/detect-multi-accounts/index.ts
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
    const { data: settings } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "ai_moderation_enabled")
      .single();

    if (settings?.value !== "true") {
      return new Response(JSON.stringify({ message: "Moderation disabled" }), { status: 200 });
    }

    // Отримуємо всіх користувачів з IP
    const { data: users } = await supabase
      .from("users")
      .select("id, reg_ip, full_name, email, role, is_banned")
      .not("reg_ip", "is", null);

    // Групуємо по IP
    const byIp: Record<string, any[]> = {};
    for (const u of users || []) {
      if (!byIp[u.reg_ip]) byIp[u.reg_ip] = [];
      byIp[u.reg_ip].push(u);
    }

    // Перевіряємо
    for (const [ip, accounts] of Object.entries(byIp)) {
      if (accounts.length < 3) continue;

      const leaders = accounts.filter(u => u.role === "owner" || u.role === "admin");
      if (leaders.length < 2) continue;

      const reason = `Виявлено ${accounts.length} акаунтів з IP ${ip}, ${leaders.length} лідерів`;

      // Лог
      await supabase.from("ai_actions_log").insert({
        action_type: "multi_account_detected",
        target_ip: ip,
        ai_reasoning: reason,
        action_taken: {
          accounts: accounts.map(u => u.id),
          count: accounts.length,
          leaders: leaders.length
        }
      });

      // Сповіщення адмінам
      const { data: admins } = await supabase
        .from("users")
        .select("id")
        .in("role", ["admin", "owner"]);

      for (const admin of admins || []) {
        await supabase.from("notifications").insert({
          user_id: admin.id,
          title: "🚨 Виявлено мультиакаунтинг",
          message: `IP ${ip}: ${accounts.length} акаунтів, ${leaders.length} лідерів. Перевірте.`,
          type: "system_alert"
        });
      }
    }

    return new Response(JSON.stringify({ processed: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
});