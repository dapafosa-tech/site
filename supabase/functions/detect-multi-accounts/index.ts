// supabase/functions/detect-multi-accounts/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async () => {
  const { data: settings } = await supabase
    .from("system_settings").select("value").eq("key", "ai_moderation_enabled").single();
  if (settings?.value !== "true") return new Response("skipped", { status: 200 });

  const { data: users } = await supabase
    .from("users").select("id, reg_ip").not("reg_ip", "is", null).eq("is_banned", false);
  const { data: leaders } = await supabase
    .from("org_members").select("user_id").eq("is_leader", true);
  const leaderIds = new Set((leaders ?? []).map((l) => l.user_id));

  const byIp: Record<string, string[]> = {};
  for (const u of users ?? []) (byIp[u.reg_ip] ??= []).push(u.id);

  for (const [ip, ids] of Object.entries(byIp)) {
    const leaderCount = ids.filter((id) => leaderIds.has(id)).length;
    if (ids.length > 5 && leaderCount >= 3) {
      const reasoning = `${ids.length} акаунтів з IP ${ip}, з них ${leaderCount} лідери організацій (дозволено max 2). Авто-бан за підозрою в мультиакаунтингу.`;
      const banUntil = new Date(Date.now() + 30 * 86400000).toISOString();
      const ipBanUntil = new Date(Date.now() + 15 * 86400000).toISOString();

      for (const id of ids) {
        await supabase.from("users")
          .update({ is_banned: true, ban_reason: `[ШІ] ${reasoning}`, banned_until: banUntil })
          .eq("id", id);
      }
      await supabase.from("banned_ips")
        .upsert({ ip, reason: reasoning, banned_until: ipBanUntil }, { onConflict: "ip" });
      await supabase.from("ai_actions_log").insert({
        action_type: "multi_account_ban",
        target_ip: ip,
        ai_reasoning: reasoning,
        action_taken: { user_ids: ids, ban_days: 30, ip_ban_days: 15 },
      });
    }
  }
  return new Response("done", { status: 200 });
});