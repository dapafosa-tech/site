// supabase/functions/ai-owner-console/index.ts
//
// Владна ШІ-консоль ("Запити") — лише для засновника.
// Викликається тригером on_ai_owner_request_created після INSERT в ai_owner_requests.
//
// Крок 1: одразу ставить status='working' + вітання.
// Крок 2: розпізнає команду:
//   - скан мультиакаунтів
//   - бан / розбан користувача
//   - призначення / зняття ролі
//   - інакше — звичайна текстова відповідь (нічого не виконує)
// Крок 3: виконує дію (якщо розпізнано), логує в ai_actions_log ТА в activity_logs
//         (щоб дія була видна в загальних логах системи), записує фінальний результат.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function generateUUID(): string {
  return crypto.randomUUID();
}

async function callGroq(system: string, user: string) {
  const groqKey = Deno.env.get("GROQ_API_KEY");
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature: 0.3,
      max_tokens: 200,
    }),
  });
  const data = await resp.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ============================================================
// ЛОГУВАННЯ: пишемо і в ai_actions_log, і в загальні activity_logs
// ============================================================
async function logAiAction(params: {
  actionType: string;
  targetUserId?: string | null;
  reasoning: string;
  actionTaken?: Record<string, unknown>;
  confidence?: string;
}) {
  await supabase.from("ai_actions_log").insert({
    action_type: params.actionType,
    target_user_id: params.targetUserId ?? null,
    ai_reasoning: params.reasoning,
    ai_confidence: params.confidence ?? null,
    action_taken: params.actionTaken ?? {},
  });

  await supabase.from("activity_logs").insert({
    id: generateUUID(),
    user_id: null,
    user_name: "🤖 ШІ Модерація (запит власника)",
    action: "ШІ: " + params.actionType,
    entity_type: "ai_action",
    entity_id: params.targetUserId ?? null,
    details: { reasoning: params.reasoning, ...params.actionTaken },
    created_at: new Date().toISOString(),
  });
}

// ============================================================
// ПОШУК ЦІЛЬОВОГО КОРИСТУВАЧА В ТЕКСТІ ЗАПИТУ
// ============================================================
async function findTargetUser(prompt: string): Promise<{ user: any | null; error?: string }> {
  const emailMatch = prompt.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    const { data } = await supabase.from("users").select("*").eq("email", emailMatch[0]).maybeSingle();
    if (data) return { user: data };
    return { user: null, error: `Користувача з email ${emailMatch[0]} не знайдено.` };
  }

  const uuidMatch = prompt.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch) {
    const { data } = await supabase.from("users").select("*").eq("id", uuidMatch[0]).maybeSingle();
    if (data) return { user: data };
    return { user: null, error: `Користувача з ID ${uuidMatch[0]} не знайдено.` };
  }

  // Пошук за іменем: після слів "користувача"/"юзера"/"клієнта"/"користувачу"
  const nameMatch = prompt.match(/(?:користувач[а-яіїєU]*|юзер[а-яіїєU]*|клієнт[а-яіїєU]*)\s+([А-ЯҐЄІЇа-яґєіїA-Za-z'\- ]{2,40}?)(?:\s+(?:на|за|з|,|\.|$))/iu);
  const rawName = nameMatch ? nameMatch[1].trim() : null;

  if (rawName) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .ilike("full_name", `%${rawName}%`)
      .limit(5);
    if (data && data.length === 1) return { user: data[0] };
    if (data && data.length > 1) {
      return { user: null, error: `Знайдено декілька користувачів з ім'ям "${rawName}" — уточніть email.` };
    }
    return { user: null, error: `Користувача "${rawName}" не знайдено. Вкажіть email для точності.` };
  }

  return { user: null, error: "Не вдалося визначити, якого користувача ви маєте на увазі. Вкажіть email." };
}

function extractDays(prompt: string): number | null {
  const m = prompt.match(/(\d+)\s*д(?:ень|ні|нів)?/iu);
  return m ? parseInt(m[1], 10) : null;
}

function extractReason(prompt: string): string {
  const m = prompt.match(/\bза\s+(.+)$/iu);
  return m ? m[1].trim().replace(/\s*на\s+\d+\s*д[а-яіїU]*\s*$/iu, "").trim() : "Дія ШІ за запитом власника";
}

// ============================================================
// ВИКОНАВЦІ ДІЙ
// ============================================================
async function doBan(prompt: string) {
  const { user, error } = await findTargetUser(prompt);
  if (!user) return { response: "❌ " + error, resultData: { action: "ban", ok: false } };

  const days = extractDays(prompt);
  const reason = extractReason(prompt);
  const bannedUntil = days ? new Date(Date.now() + days * 86400000).toISOString() : null;

  await supabase
    .from("users")
    .update({ is_banned: true, ban_reason: reason, banned_until: bannedUntil, banned_by_ai: true })
    .eq("id", user.id);

  const summary = `Забанено ${user.full_name || user.email}${days ? " на " + days + " дн." : " назавжди"}. Причина: ${reason}`;
  await logAiAction({
    actionType: "ban",
    targetUserId: user.id,
    reasoning: `[Запит власника] ${summary}`,
    actionTaken: { days, reason, banned_until: bannedUntil },
  });

  return { response: "✅ " + summary, resultData: { action: "ban", ok: true, target_user_id: user.id } };
}

async function doUnban(prompt: string) {
  const { user, error } = await findTargetUser(prompt);
  if (!user) return { response: "❌ " + error, resultData: { action: "unban", ok: false } };

  await supabase
    .from("users")
    .update({ is_banned: false, ban_reason: null, banned_until: null })
    .eq("id", user.id);

  const summary = `Розблоковано ${user.full_name || user.email}.`;
  await logAiAction({
    actionType: "unban",
    targetUserId: user.id,
    reasoning: `[Запит власника] ${summary}`,
  });

  return { response: "✅ " + summary, resultData: { action: "unban", ok: true, target_user_id: user.id } };
}

async function doSetRole(prompt: string, role: "admin" | "moderator" | "user") {
  const { user, error } = await findTargetUser(prompt);
  if (!user) return { response: "❌ " + error, resultData: { action: "set_role", ok: false } };

  if (user.role === "owner") {
    return { response: "❌ Не можна змінювати роль засновника.", resultData: { action: "set_role", ok: false } };
  }

  await supabase.from("users").update({ role }).eq("id", user.id);

  const roleLabel = role === "admin" ? "адміністратора" : role === "moderator" ? "модератора" : "звичайного користувача";
  const summary = `Призначено роль "${roleLabel}" користувачу ${user.full_name || user.email}.`;
  await logAiAction({
    actionType: role === "user" ? "remove_role" : "set_role",
    targetUserId: user.id,
    reasoning: `[Запит власника] ${summary}`,
    actionTaken: { new_role: role },
  });

  return { response: "✅ " + summary, resultData: { action: "set_role", ok: true, target_user_id: user.id, role } };
}

async function runMultiAccountScan(): Promise<string> {
  const { data: users } = await supabase
    .from("users")
    .select("id, reg_ip, full_name, email, role")
    .not("reg_ip", "is", null);

  const byIp: Record<string, any[]> = {};
  for (const u of users ?? []) {
    if (!byIp[u.reg_ip]) byIp[u.reg_ip] = [];
    byIp[u.reg_ip].push(u);
  }

  const findings: string[] = [];
  for (const [ip, accounts] of Object.entries(byIp)) {
    if (accounts.length < 3) continue;
    const leaders = accounts.filter((u) => u.role === "owner" || u.role === "admin");
    if (leaders.length < 2) continue;
    findings.push(
      `IP ${ip}: ${accounts.length} акаунтів (${accounts.map((a) => a.full_name || a.email).join(", ")}), з них ${leaders.length} лідерів`
    );

    await supabase.from("ai_actions_log").insert({
      action_type: "multi_account_detected",
      target_ip: ip,
      ai_reasoning: `Виявлено через ручний запит власника: ${accounts.length} акаунтів, ${leaders.length} лідерів`,
      action_taken: { accounts: accounts.map((u) => u.id), count: accounts.length, leaders: leaders.length },
    });
  }

  return findings.length
    ? `Знайдено підозрілі групи:\n${findings.join("\n")}`
    : "Підозрілих груп мультиакаунтів не знайдено.";
}

// ============================================================
// РОЗПІЗНАВАННЯ КОМАНДИ З ТЕКСТУ ЗАПИТУ
// Порядок перевірок важливий: "розбан" містить підрядок "бан",
// тому спершу перевіряємо unban/remove_role, і лише потім ban/set_role.
// ============================================================
async function handlePrompt(prompt: string): Promise<{ response: string; resultData: Record<string, unknown> }> {
  const p = prompt.toLowerCase();

  if (p.includes("мультиакаунт") || p.includes("мульти акаунт") || p.includes("мультиюз")) {
    return { response: await runMultiAccountScan(), resultData: { action: "multi_account_scan" } };
  }

  if (p.includes("розбан") || p.includes("розблок")) {
    return await doUnban(prompt);
  }

  if (p.includes("зніми роль") || p.includes("розжалуй") || p.includes("скинь роль") || p.includes("зроби користувачем") || p.includes("зніми права")) {
    return await doSetRole(prompt, "user");
  }

  if (p.includes("бан") || p.includes("заблок")) {
    return await doBan(prompt);
  }

  if (p.includes("адмін")) {
    return await doSetRole(prompt, "admin");
  }

  if (p.includes("модератор")) {
    return await doSetRole(prompt, "moderator");
  }

  // Немає розпізнаної дії — звичайна відповідь, нічого не виконуємо
  const response = await callGroq(
    "Ти асистент-консоль для засновника платформи Typebiz. Ти вмієш виконувати команди: " +
      "бан/розбан користувача (за email), призначення/зняття ролі модератора чи адміністратора, " +
      "пошук мультиакаунтів. Якщо запит власника не відповідає жодній з цих команд, чесно поясни " +
      "це і запропонуй переформулювати запит, вказавши email користувача. Відповідай українською, коротко.",
    prompt
  );
  return { response, resultData: { action: "reply_only" } };
}

Deno.serve(async (req) => {
  try {
    const { request_id } = await req.json();
    if (!request_id) {
      return new Response(JSON.stringify({ error: "request_id required" }), { status: 400 });
    }

    const { data: request, error } = await supabase
      .from("ai_owner_requests")
      .select("*, requester:requested_by (id, role, full_name)")
      .eq("id", request_id)
      .single();

    if (error || !request) {
      return new Response(JSON.stringify({ error: "Request not found" }), { status: 404 });
    }

    // ЗАХИСТ: тільки засновник (owner) може віддавати команди ШІ-консолі.
    if (request.requester?.role !== "owner") {
      await supabase
        .from("ai_owner_requests")
        .update({ status: "error", response: "Відмовлено: лише засновник може надсилати команди ШІ-консолі." })
        .eq("id", request_id);
      return new Response(JSON.stringify({ error: "Forbidden: owner only" }), { status: 403 });
    }

    const greeting = "Привіт! Беруся за завдання, зачекайте, будь ласка...";
    await supabase.from("ai_owner_requests").update({ status: "working", greeting }).eq("id", request_id);

    const { response, resultData } = await handlePrompt(request.prompt || "");

    await supabase
      .from("ai_owner_requests")
      .update({ status: "done", response, result_data: resultData })
      .eq("id", request_id);

    await supabase.from("ai_actions_log").insert({
      action_type: "owner_console_request",
      ai_reasoning: `[Запит власника] ${request.prompt}`,
      action_taken: { request_id, response, ...resultData },
    });

    return new Response(JSON.stringify({ success: true, response }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
