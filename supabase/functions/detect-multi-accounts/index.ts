// supabase/functions/detect-multi-accounts/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const CRON_SECRET = Deno.env.get("CRON_SECRET");

function isAuthorized(req: Request): boolean {
  if (!CRON_SECRET) return false;
  return req.headers.get("x-cron-secret") === CRON_SECRET;
}

Deno.serve(async (req) => {
  if (!isAuthorized(req)) {
    return new Response("unauthorized", { status: 401 });
  }

  const { data: settings } = await supabase
    .from("system_settings").select("value").eq("key", "ai_moderation_enabled").single();
  if (settings?.value !== "true") return new Response("skipped", { status: 200 });

  const { data: users } = await supabase
    .from("users").select("id, reg_ip, full_name, email").not("reg_ip", "is", null).eq("is_banned", false);
  const { data: leaders } = await supabase
    .from("org_members").select("user_id").eq("is_leader", true);
  const leaderIds = new Set((leaders ?? []).map((l) => l.user_id));

  const byIp: Record<string, string[]> = {};
  const userNames: Record<string, string> = {};
  for (const u of users ?? []) {
    byIp[u.reg_ip] ??= [];
    byIp[u.reg_ip].push(u.id);
    userNames[u.id] = u.full_name || u.email || 'Користувач';
  }

  for (const [ip, ids] of Object.entries(byIp)) {
    const leaderCount = ids.filter((id) => leaderIds.has(id)).length;
    if (ids.length >= 3 && leaderCount >= 3) {
      // Дістаємо засновників
      const { data: owners } = await supabase
        .from("users").select("id").eq("role", "owner");

      const ownerIds = owners?.map(o => o.id) || [];

      // Створюємо повідомлення для засновників
      const message = [
        `🔍 ВИЯВЛЕНО МУЛЬТИАКАУНТИНГ`,
        `IP-адреса: ${ip}`,
        `Кількість акаунтів: ${ids.length}`,
        `З них лідерів організацій: ${leaderCount}`,
        `Акаунти:`,
        ...ids.map(id => `  - ${userNames[id] || id}`),
        ``,
        `📋 Рекомендація:`,
        `  - Бан всіх акаунтів на 1-3 дні (перше порушення)`,
        `  - При повторі - бан на 5-30 днів`,
        `  - Рекомендований термін: ${leaderCount >= 5 ? '30 днів' : leaderCount >= 4 ? '14 днів' : '7 днів'}`,
        ``,
        `⚡ Дія: Акаунти не заблоковано автоматично. Потрібне ручне рішення засновника.`
      ].join('\n');

      // Відправляємо повідомлення кожному засновнику (через support tickets)
      for (const ownerId of ownerIds) {
        await supabase.from("support_tickets").insert({
          user_id: ownerId,
          subject: `🚨 Виявлено мультиакаунтинг з IP ${ip}`,
          message: message,
          type: 'system_alert',
          priority: 'high',
          status: 'open',
          created_at: new Date().toISOString()
        });
      }

      // Логуємо
      await supabase.from("ai_actions_log").insert({
        action_type: "multi_account_detected",
        target_ip: ip,
        ai_reasoning: `Виявлено ${ids.length} акаунтів з IP ${ip}, ${leaderCount} з них лідери`,
        action_taken: { 
          user_ids: ids, 
          detected: true, 
          notified_owners: ownerIds.length,
          recommended_ban_days: leaderCount >= 5 ? 30 : leaderCount >= 4 ? 14 : 7
        },
      });
    }
  }
  return new Response("done", { status: 200 });
});