// supabase/functions/public-flags/index.ts
//
// Публічна (без JWT) функція, яку викликає register.html ПЕРЕД тим, як
// показати форму реєстрації / відправити її.
//
// Повертає:
//   { registrationEnabled: boolean, ipBanned: boolean }
//
// IP визначається на стороні edge-мережі Supabase з заголовка
// x-forwarded-for, тому його не можна підмінити з браузера так само
// легко, як значення, яке саме шле клієнт.
//
// Деплой ОБОВ'ЯЗКОВО з --no-verify-jwt (ця функція публічна за задумом,
// register.html викликає її ще до того, як у користувача є акаунт):
//   supabase functions deploy public-flags --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function getClientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const ip = getClientIp(req);

  const [{ data: regSetting }, ipBanRow] = await Promise.all([
    supabase.from("system_settings").select("value").eq("key", "registration_enabled").maybeSingle(),
    ip
      ? supabase.from("banned_ips").select("banned_until").eq("ip", ip).maybeSingle()
      : Promise.resolve({ data: null } as any),
  ]);

  // Немає рядка в system_settings -> за замовчуванням реєстрація дозволена.
  const registrationEnabled = regSetting?.value !== "false";

  let ipBanned = false;
  const banRow = (ipBanRow as any)?.data;
  if (banRow) {
    ipBanned = !banRow.banned_until || new Date(banRow.banned_until).getTime() > Date.now();
  }

  return new Response(JSON.stringify({ registrationEnabled, ipBanned }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});