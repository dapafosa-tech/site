// supabase/functions/ai-support-agent/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ============================================================
// ПРАВИЛА БАНУ ЗА РОЛЯМИ
// - owner: ШІ НІКОЛИ не банить сам. Завжди ескалація до людини.
// - admin: бан можливий ЛИШЕ якщо є підтверджені докази:
//     (a) масовий бан 10+ людей за останню 1 хвилину цим адміном, або
//     (b) активна мультиакаунт-мітка на цього адміна (очікує розбору).
//   Інакше — ескалація, а не бан.
// - moderator / user: ШІ вирішує сам.
// ============================================================

const MASS_BAN_THRESHOLD = 10;
const MASS_BAN_WINDOW_MIN = 1;
const DEFAULT_GRACE_MINUTES = 10;
const INACTIVITY_AUTOCLOSE_DAYS = 3;

// Текст-маркер привітального повідомлення ШІ. Використовується замість
// окремої колонки message_kind, щоб не залежати від схеми БД.
const GREETING_PREFIX = "Вітаю! Я передивився";

const CLOSE_KEYWORDS = [
  "закрий", "close", "заверши", "закривай", "досить",
  "спасибо", "дякую", "закрито", "все, дякую", "розібрались", "розібралися"
];

// ============================================================
// БАЗА ЗНАНЬ ПРО ФУНКЦІОНАЛ САЙТУ.
// Дозволяє ШІ відповідати одразу на прості питання "як зробити X"
// без грейс-періоду й без ескалації.
// ============================================================
const SITE_KNOWLEDGE = `
ДОВІДКА ПО TYPEBIZ (використовуй це, щоб відповідати на "як зробити X" одразу,
без ескалації - requires_investigation має бути false для таких простих питань):

РЕЄСТРАЦІЯ І ВХІД:
- Реєстрація: email, пароль, ім'я та прізвище (рівно 2 слова з великої літери),
  номер телефону (обов'язково), юридична адреса (необов'язково). Після реєстрації
  на пошту приходить 6-значний код підтвердження - без нього акаунт неактивний.
- Вхід: email + пароль + ім'я та прізвище (звіряється з профілем).
- Забув пароль: на сторінці "Забули пароль" - вводиш email, приходить код,
  вводиш код і новий пароль.
- Зміна email/пароля: в "Налаштування" (Settings) в кабінеті, теж з підтвердженням
  кодом на пошту.
- Зміна аватарки: в "Налаштування" або "Профіль" - завантажити нове фото.

ОРГАНІЗАЦІЇ:
- Створити організацію: на дашборді кнопка "Створити організацію" - вказати назву
  і тип (ресторан, магазин, готель, клініка, школа, бібліотека, автосервіс,
  IT-компанія, нерухомість, логістика, салон краси, спортзал, тощо).
- Вступити в існуючу організацію: кнопка "Приєднатися за кодом" на дашборді,
  ввести 19-значний код(приклад: keag-lwsf-dojr-pwnu), який дає керівник організації.
- Код організації: керівник бачить його в картці своєї організації, може
  поділитися з новими учасниками.
- Ліміти: скільки організацій може створити один користувач і скільки учасників
  може бути в організації - налаштовується адміністрацією платформи (за
  замовчуванням є розумні ліміти).

ВСЕРЕДИНІ ОРГАНІЗАЦІЇ (для керівника/учасників):
- Додати людину в організацію: людина сама вступає за кодом організації
  (Приєднатися за кодом), або подає заявку на вступ, яку керівник підтверджує
  в розділі заявок.
- Учасники: список у розділі "Учасники" - там же призначення посад (рангів)
  і відділів, видалення учасника (тільки керівник).
- Посади (ранги): керівник створює посади з кольором і правами доступу
  в розділі учасників.
- Відділи: групування учасників за напрямками роботи.
- Чат організації: спільний чат з пошуком повідомлень, згадуванням через @,
  можна видалити своє повідомлення (або будь-яке - якщо ти керівник).
- Задачі, події, відпустки, опитування - окремі розділи в організації
  для планування роботи команди.
- Галузеві модулі залежно від типу організації: у ресторану - меню/замовлення/
  бронювання столиків; у готелю - номери/бронювання; у магазину - товари/продажі;
  у клініки - пацієнти/прийоми; у бібліотеки - книги/читачі/видача; у школи -
  класи/учні/оцінки; у автосервісу - запчастини/замовлення; у IT-компанії -
  проекти/баги; у ріелторів - об'єкти/угоди; у салону краси - послуги/записи;
  у спортзалу - абонементи/тренування.

ПІДТРИМКА, СКАРГИ, АПЕЛЯЦІЇ:
- Звернення в підтримку: кнопка "Підтримка" на дашборді - створюєш тикет
  з темою і описом (це і є цей чат).
- Поскаржитись на учасника організації: у списку учасників є кнопка "Скарга"
  біля потрібної людини.
- Якщо акаунт заблокували: на сторінці блокування є кнопка "Апеляція" -
  можна пояснити ситуацію, апеляцію розгляне модератор/адмін/засновник.
  На кожен новий бан можна подати нову апеляцію (стара, з попереднього
  бану, лишається архівом і не заважає новій).

Якщо питання користувача - просте "як зробити X" по темах вище, ти ЗНАЄШ
відповідь з цієї довідки і маєш дати її одразу (requires_investigation: false,
action: "close"). Розслідування (requires_investigation: true) потрібне лише
для скарг на когось, підозри на порушення, бану/розбану, багоюзу тощо - НЕ
для звичайних питань "як користуватись сайтом".
`;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isStaffRole(role: string) {
  return role === "owner" || role === "admin" || role === "moderator" || role === "bot";
}

function getShortTicketId(fullId: string): string {
  if (!fullId) return "???????";
  return "#" + fullId.replace(/-/g, "").slice(0, 8);
}

function isGreetingMessage(message: string | null | undefined): boolean {
  return !!message && message.indexOf(GREETING_PREFIX) === 0;
}

function isCloseRequest(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return CLOSE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

async function getAiSupportSettings() {
  const { data } = await supabase
    .from("system_settings")
    .select("key, value")
    .in("key", ["ai_support_enabled", "ai_support_grace_minutes"]);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return {
    enabled: map["ai_support_enabled"] !== "false",
    graceMinutes:
      parseInt(map["ai_support_grace_minutes"] || String(DEFAULT_GRACE_MINUTES), 10) ||
      DEFAULT_GRACE_MINUTES,
  };
}

async function getTicketWithRetry(ticket_id: string, attempts = 3, delayMs = 400) {
  let lastError: any = null;
  for (let i = 0; i < attempts; i++) {
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .select(`
        *,
        user:user_id (id, full_name, email, role, is_banned, ban_reason, banned_until, reg_ip, last_ip)
      `)
      .eq("id", ticket_id)
      .single();

    if (ticket) return { ticket, error: null };
    lastError = error;

    // PGRST116 = "не знайдено рядка" - може бути race condition одразу після insert
    if (error?.code !== "PGRST116") break;

    if (i < attempts - 1) {
      console.log(`⏳ Тікет ${ticket_id} ще не видно (спроба ${i + 1}/${attempts}), повтор через ${delayMs}мс`);
      await sleep(delayMs);
    }
  }
  return { ticket: null, error: lastError };
}

async function hasMassBanEvidence(adminId: string): Promise<{ found: boolean; count: number }> {
  const since = new Date(Date.now() - MASS_BAN_WINDOW_MIN * 60000).toISOString();
  const { count } = await supabase
    .from("activity_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", adminId)
    .ilike("action", "%ban%")
    .gte("created_at", since);
  const c = count ?? 0;
  return { found: c >= MASS_BAN_THRESHOLD, count: c };
}

async function hasPendingMultiAccountFlag(adminId: string): Promise<boolean> {
  const { data } = await supabase
    .from("ai_actions_log")
    .select("action_taken, created_at")
    .eq("action_type", "multi_account_detected")
    .order("created_at", { ascending: false })
    .limit(50);

  for (const row of data ?? []) {
    const accounts: string[] = row.action_taken?.accounts ?? [];
    if (accounts.includes(adminId)) return true;
  }
  return false;
}

// Дані про цільового користувача скарги (якщо тикет пов'язаний зі скаргою)
async function getTargetUserContext(relatedReportId: string | null) {
  if (!relatedReportId) return null;

  const { data: report } = await supabase
    .from("reports")
    .select("id, reason, status, target_user_id, from_user_id, created_at")
    .eq("id", relatedReportId)
    .single();

  if (!report || !report.target_user_id) return null;

  const { data: target } = await supabase
    .from("users")
    .select("id, full_name, email, role, is_banned, ban_reason, banned_until, reg_ip, last_ip, created_at")
    .eq("id", report.target_user_id)
    .single();

  const { data: banHistory } = await supabase
    .from("ai_actions_log")
    .select("action_type, ai_reasoning, target_ip, created_at")
    .eq("target_user_id", report.target_user_id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Чи є інші акаунти з тим самим reg_ip/last_ip (для перевірки багоюзу/мультиакаунтингу)
  let ipMatches: any[] = [];
  if (target?.reg_ip || target?.last_ip) {
    const ips = [target.reg_ip, target.last_ip].filter(Boolean);
    const { data: matches } = await supabase
      .from("users")
      .select("id, full_name, email, reg_ip, last_ip, is_banned")
      .neq("id", report.target_user_id)
      .or(ips.map((ip) => `reg_ip.eq.${ip},last_ip.eq.${ip}`).join(","));
    ipMatches = matches ?? [];
  }

  return { report, target, banHistory: banHistory ?? [], ipMatches };
}

async function createAdminFormForEscalation(ticket: any, reason: string, targetUserId?: string) {
  const shortId = getShortTicketId(ticket.id);
  const formData = {
    form_type: "request",
    created_by: null,
    created_by_role: "ai",
    recipient_text: "admin_team",
    subject: `Потрібен ручний розгляд тікета ${shortId}`,
    body: `Тікет від ${ticket.user?.full_name || ticket.user?.email}: ${ticket.message}\n\nПричина ескалації: ${reason}`,
    target_user_id: targetUserId || ticket.user_id,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from("admin_forms").insert(formData);
    console.log(`✅ Адмін-форму створено для тікета ${shortId}`);
  } catch (error) {
    console.error("❌ Помилка створення адмін-форми:", error);
  }
}

async function notifyStaffOfEscalation(ticket: any, shortId: string, reasonText: string) {
  const { data: staff } = await supabase
    .from("users")
    .select("id")
    .in("role", ["owner", "admin", "moderator"]);

  for (const member of staff ?? []) {
    try {
      await supabase.from("notifications").insert({
        user_id: member.id,
        title: "🔺 Потрібен ручний розгляд тікета",
        message: `Тікет ${shortId} від ${ticket.user?.full_name || ticket.user?.email}. ${reasonText}`,
        type: "support_escalation",
        link: "/admin",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Помилка створення сповіщення:", error);
    }
  }
}

async function insertAiMessage(ticketId: string, message: string) {
  await supabase.from("support_messages").insert({
    ticket_id: ticketId,
    sender_id: null,
    sender_type: "ai",
    message,
    created_at: new Date().toISOString(),
  });
}

async function closeTicket(ticketId: string) {
  await supabase
    .from("support_tickets")
    .update({
      status: "closed",
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      console.error("❌ Помилка парсингу JSON:", e);
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { ticket_id } = body;
    if (!ticket_id) {
      return jsonResponse({ error: "ticket_id required" }, 400);
    }

    console.log(`📥 Отримано запит на обробку тікета: ${ticket_id}`);

    const settings = await getAiSupportSettings();
    if (!settings.enabled) {
      return jsonResponse({ message: "AI support disabled" });
    }

    const { ticket, error } = await getTicketWithRetry(ticket_id);
    if (error || !ticket) {
      console.error("❌ Тікет не знайдено:", error);
      return jsonResponse({ error: "Ticket not found" }, 404);
    }

    if (ticket.status === "closed" || ticket.status === "resolved") {
      return jsonResponse({ message: "Already closed" });
    }

    const shortId = getShortTicketId(ticket.id);
    console.log(`✅ Тікет знайдено: ${shortId}`);

    // ============================================================
    // 1. ЧИ Є ВІДПОВІДЬ ВІД ЖИВОГО ПЕРСОНАЛУ - ШІ НЕ ВТРУЧАЄТЬСЯ
    // ============================================================
    const { data: allMessages } = await supabase
      .from("support_messages")
      .select("sender_type, sender_id, message, created_at")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: false });

    const messages = allMessages ?? [];

    const hasStaffReply = messages.some(
      (m) => isStaffRole(m.sender_type) && m.sender_type !== "ai"
    );
    if (hasStaffReply) {
      console.log("👨‍💼 В тікеті вже відповів персонал - ШІ не втручається");
      return jsonResponse({ message: "Human staff already replied - AI will not interfere", action: "staff_handled" });
    }

    const latestUserMessage = messages.find((m) => m.sender_type === "user");
    const userRequestedClose =
      isCloseRequest(ticket.message) || isCloseRequest(latestUserMessage?.message);

    // ============================================================
    // 2. ЗАСНОВНИК (owner) - ЗАКРИВАЄМО ТІКЕТ ПІСЛЯ ВІДПОВІДІ АБО ЗА ЗАПИТОМ
    // ============================================================
    const isOwner = ticket.user?.role === "owner";
    if (isOwner) {
      const hasAiReply = messages.some(
        (m) => m.sender_type === "ai" && m.message?.length > 20 && !isGreetingMessage(m.message)
      );

      if (hasAiReply || userRequestedClose) {
        await insertAiMessage(
          ticket.id,
          "👑 Тікет закрито для засновника. Якщо потрібна допомога - створіть новий тікет."
        );
        await closeTicket(ticket.id);
        console.log(`✅ Тікет ${shortId} закрито для засновника`);
        return jsonResponse({
          success: true,
          ticket_id: ticket.id,
          short_id: shortId,
          action: "closed_for_owner",
          result: "Тікет закрито для засновника",
        });
      }
    }

    // ============================================================
    // 3. КОРИСТУВАЧ ПРОСИТЬ ЗАКРИТИ ТІКЕТ
    // ============================================================
    if (userRequestedClose) {
      await insertAiMessage(
        ticket.id,
        "✅ Тікет закрито за вашим запитом. Якщо матимете ще питання - створіть новий тікет."
      );
      await closeTicket(ticket.id);
      return jsonResponse({
        success: true,
        ticket_id: ticket.id,
        short_id: shortId,
        action: "closed_by_user_request",
        result: "Тікет закрито за запитом користувача",
      });
    }

    // ============================================================
    // 4. ТІКЕТ НЕАКТИВНИЙ 3+ ДНІ - АВТОЗАКРИТТЯ
    // ============================================================
    const lastActivity = new Date(ticket.updated_at || ticket.created_at);
    const daysInactive = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

    if (daysInactive >= INACTIVITY_AUTOCLOSE_DAYS) {
      await insertAiMessage(
        ticket.id,
        `⏰ Тікет автоматично закрито через ${INACTIVITY_AUTOCLOSE_DAYS} дні бездіяльності. Якщо потрібна допомога - створіть новий тікет.`
      );
      await closeTicket(ticket.id);
      return jsonResponse({
        success: true,
        ticket_id: ticket.id,
        short_id: shortId,
        action: "closed_inactive_3days",
        result: `Тікет закрито через ${INACTIVITY_AUTOCLOSE_DAYS} дні бездіяльності`,
      });
    }

    // ============================================================
    // 5. ЗАХИСТ ВІД ПОВТОРНОЇ ОБРОБКИ: якщо останнє (не привітальне)
    // повідомлення вже від ШІ, а користувач ще не відповів - чекаємо.
    // ============================================================
    const lastNonGreeting = messages.find((m) => !isGreetingMessage(m.message));
    if (lastNonGreeting && lastNonGreeting.sender_type === "ai") {
      return jsonResponse({
        success: true,
        ticket_id: ticket.id,
        short_id: shortId,
        action: "already_answered",
        result: "ШІ вже відповів, очікується відповідь користувача",
      });
    }

    // ============================================================
    // 6. КОНТЕКСТ ДЛЯ ШІ
    // ============================================================
    const targetCtx = await getTargetUserContext(ticket.related_report_id);

    const { data: orgs } = await supabase
      .from("org_members")
      .select("organizations(name, type, status)")
      .eq("user_id", ticket.user_id);

    const { data: history } = await supabase
      .from("ai_actions_log")
      .select("*")
      .eq("target_user_id", ticket.user_id)
      .order("created_at", { ascending: false })
      .limit(5);

    const targetBlock = targetCtx
      ? `
ЦЕЙ ТІКЕТ ПОВ'ЯЗАНИЙ ЗІ СКАРГОЮ. Дані ЦІЛЬОВОГО користувача скарги (не автора тікету):
- Ім'я: ${targetCtx.target?.full_name || targetCtx.target?.email}
- Роль: ${targetCtx.target?.role}
- Причина скарги: ${targetCtx.report.reason}
- Забанений зараз: ${targetCtx.target?.is_banned ? "Так (" + targetCtx.target?.ban_reason + ")" : "Ні"}
- reg_ip: ${targetCtx.target?.reg_ip || "немає"}
- last_ip: ${targetCtx.target?.last_ip || "немає"}
- Акаунти з тим самим IP (reg_ip/last_ip): ${
          targetCtx.ipMatches.length
            ? targetCtx.ipMatches
                .map((u: any) => `${u.full_name || u.email} (id:${u.id}${u.is_banned ? ", вже забанений" : ""})`)
                .join("; ")
            : "немає збігів"
        }
- Історія дій ШІ проти цього користувача: ${
          targetCtx.banHistory.length
            ? targetCtx.banHistory
                .map((h: any) => `${new Date(h.created_at).toLocaleString("uk-UA")}: ${h.action_type}`)
                .join("; ")
            : "немає"
        }
`
      : "";

    const context = `
ТІКЕТ ${shortId}
Від: ${ticket.user?.full_name || ticket.user?.email}
Тема: ${ticket.subject}
Повідомлення: ${ticket.message}
Тип: ${ticket.type || "general"}
Статус: ${ticket.status}

ІНФО ПРО АВТОРА ТІКЕТУ:
- Роль: ${ticket.user?.role || "user"}
- Забанений: ${ticket.user?.is_banned ? "Так" : "Ні"}
- IP: ${ticket.user?.reg_ip || "Невідомо"}

ОРГАНІЗАЦІЇ АВТОРА:
${orgs?.map((o: any) => `- ${o.organizations?.name || "Невідома"}`).join("\n") || "Немає"}

ІСТОРІЯ АВТОРА:
${history?.map((h: any) => `- ${new Date(h.created_at).toLocaleString("uk-UA")}: ${h.action_type}`).join("\n") || "Немає"}
${targetBlock}
${SITE_KNOWLEDGE}
ТИ АГЕНТ ПІДТРИМКИ TYPEBIZ. Спочатку визнач, чи цей тікет можна вирішити ОДРАЗУ
(проста відповідь по системі - див. довідку вище, без потреби перевіряти
людину/логи/IP/докази), чи потрібне РОЗСЛІДУВАННЯ (скарги на когось, підозра
на порушення, багоюз, бан на кілька днів тощо).

ВАЖЛИВО:
1. Якщо питання просте і ти можеш дати повну відповідь одним повідомленням -
   requires_investigation: false, action: "close" - тікет закриється одразу.
2. Якщо потрібне втручання людини - action: "escalate".
3. action: "reply" використовуй, лише якщо відповідаєш, але свідомо лишаєш
   тікет відкритим для продовження розмови (тікет НЕ закриється).
4. НІКОЛИ не показуй IP, паролі або особисті дані інших користувачів.

ВІДПОВІДАЙ ТІЛЬКИ JSON:
{
  "requires_investigation": true/false,
  "action": "close|reply|ban|unban|escalate",
  "message": "відповідь користувачеві",
  "ban_days": число (якщо ban),
  "reason": "коротка причина дії"
}`;

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) {
      console.error("❌ GROQ_API_KEY не налаштований");
      return jsonResponse({ error: "GROQ_API_KEY not set" }, 500);
    }

    console.log("🤖 Виклик Groq API...");
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "Ти агент підтримки Typebiz. У тебе є довідка про функціонал сайту в повідомленні користувача - користуйся нею для точних відповідей. Відповідай тільки JSON.",
          },
          { role: "user", content: context },
        ],
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("❌ Groq API помилка:", errorText);
      throw new Error("Groq API error: " + errorText);
    }

    const result = await groqResponse.json();
    let decision: any;
    try {
      decision = JSON.parse(result.choices[0].message.content);
    } catch (e) {
      console.error("❌ Помилка парсингу відповіді Groq:", e);
      decision = {
        requires_investigation: false,
        action: "close",
        message: "Ваше звернення оброблено. Тікет закрито.",
        reason: "Оброблено ШІ (fallback)",
      };
    }

    console.log("🤖 ШІ прийняв рішення:", decision);

    // ============================================================
    // 7. ФАЗА ВІТАННЯ: якщо тікет потребує розслідування і ще не
    // було привітання - надсилаємо ТІЛЬКИ вітання і чекаємо грейс-період.
    // Прості питання (requires_investigation=false) обробляються одразу,
    // без грейс-періоду і без вітання.
    // ============================================================
    const createdAt = new Date(ticket.created_at).getTime();
    const minutesSinceCreated = (Date.now() - createdAt) / 60000;
    const graceElapsed = minutesSinceCreated >= settings.graceMinutes;

    if (decision.requires_investigation && !ticket.ai_greeted) {
      const greeting = `${GREETING_PREFIX} ваш тикет і взявся за перевірку. Це вимагає додаткового розгляду (${
        targetCtx ? "перевірка користувача, IP, історії" : "деталей"
      }), тож зачекайте, будь ласка — я повернусь з відповіддю.`;

      await insertAiMessage(ticket.id, greeting);
      await supabase
        .from("support_tickets")
        .update({ status: "in_progress", ai_greeted: true, updated_at: new Date().toISOString() })
        .eq("id", ticket.id);

      await supabase.from("ai_actions_log").insert({
        action_type: "support_ticket",
        target_user_id: ticket.user_id,
        related_ticket_id: ticket.id,
        related_report_id: ticket.related_report_id,
        ai_reasoning: `[Тікет ${shortId}] Вітання надіслано, розслідування заплановане (грейс-період: ${settings.graceMinutes} хв.)`,
        action_taken: { ticket_id: ticket.id, phase: "greeting" },
      });

      return jsonResponse({
        success: true,
        ticket_id: ticket.id,
        short_id: shortId,
        action: "greeting",
        result: "Вітання надіслано, очікує грейс-період",
      });
    }

    if (decision.requires_investigation && ticket.ai_greeted && !graceElapsed) {
      return jsonResponse({
        success: true,
        ticket_id: ticket.id,
        short_id: shortId,
        action: "waiting",
        result: `Очікування грейс-періоду (лишилось ~${Math.ceil(settings.graceMinutes - minutesSinceCreated)} хв.)`,
      });
    }

    // ============================================================
    // 8. ЗАСТОСОВУЄМО РОЛЬОВІ ГАРАНТІЇ ПЕРЕД ВИКОНАННЯМ БАНУ
    // ============================================================
    const targetRole = ticket.user?.role || "user";
    let effectiveAction = decision.action;
    let guardNote = "";

    if (effectiveAction === "ban") {
      if (targetRole === "owner") {
        effectiveAction = "escalate";
        guardNote = "Заблоковано ШІ-політикою: власників ніколи не банити автоматично.";
      } else if (targetRole === "admin") {
        const [massBan, multiAccount] = await Promise.all([
          hasMassBanEvidence(ticket.user_id),
          hasPendingMultiAccountFlag(ticket.user_id),
        ]);
        if (!massBan.found && !multiAccount) {
          effectiveAction = "escalate";
          guardNote = `Заблоковано ШІ-політикою: адміна можна банити лише за масовий бан (${MASS_BAN_THRESHOLD}+ за ${MASS_BAN_WINDOW_MIN} хв, знайдено ${massBan.count}) або підтверджений мультиакаунтинг. Жодного не виявлено — ескалація до людини.`;
        } else {
          guardNote = massBan.found
            ? `Дозволено: виявлено масовий бан (${massBan.count} дій за ${MASS_BAN_WINDOW_MIN} хв).`
            : "Дозволено: активна мультиакаунт-мітка очікує розбору.";
        }
      }
    }

    // ============================================================
    // 9. ВИКОНАННЯ ДІЇ
    // ============================================================
    let actionResult = "";
    let finalMessage = decision.message || "Ваше звернення оброблено.";
    let ticketClosed = false;

    if (effectiveAction === "close") {
      actionResult = `Тікет ${shortId} закрито`;
    } else if (effectiveAction === "reply") {
      actionResult = `Відповідь надіслана в тікет ${shortId}, тікет лишається відкритим`;
    } else if (effectiveAction === "ban") {
      const days = decision.ban_days || 3;
      const until = new Date(Date.now() + days * 86400000).toISOString();
      await supabase
        .from("users")
        .update({
          is_banned: true,
          ban_reason: `[Тікет ${shortId}] ${decision.reason || "Порушення правил"}`,
          banned_until: until,
        })
        .eq("id", ticket.user_id);
      actionResult = `Заблоковано на ${days} днів (тікет ${shortId})`;
      finalMessage = `Ваш акаунт заблоковано на ${days} днів. Причина: ${decision.reason || "Порушення правил"}`;
      effectiveAction = "close"; // технічно закриваємо тікет після бану
    } else if (effectiveAction === "unban") {
      await supabase
        .from("users")
        .update({ is_banned: false, ban_reason: null, banned_until: null })
        .eq("id", ticket.user_id);
      actionResult = `Розблоковано (тікет ${shortId})`;
      finalMessage = "Ваш акаунт розблоковано.";
      effectiveAction = "close";
    } else if (effectiveAction === "escalate") {
      const reasonText = guardNote || decision.reason || "Необхідне втручання людини";
      await createAdminFormForEscalation(ticket, reasonText, ticket.user_id);
      await notifyStaffOfEscalation(ticket, shortId, reasonText);
      actionResult = `Передано в Адмін-Форми (тікет ${shortId})`;
      finalMessage = decision.message || "Ваше звернення передано адміністрації для детального розгляду.";
    }

    await insertAiMessage(ticket.id, finalMessage);

    if (effectiveAction === "close") {
      await closeTicket(ticket.id);
      ticketClosed = true;
    } else {
      // escalate / reply - лишаємо тікет активним
      await supabase
        .from("support_tickets")
        .update({ status: "in_progress", updated_at: new Date().toISOString() })
        .eq("id", ticket.id);
    }

    await supabase.from("ai_actions_log").insert({
      action_type: "support_ticket",
      target_user_id: ticket.user_id,
      related_ticket_id: ticket.id,
      related_report_id: ticket.related_report_id,
      ai_reasoning: `[Тікет ${shortId}] Дія: ${effectiveAction}. Причина: ${decision.reason || "Немає"}${guardNote ? " | " + guardNote : ""}`,
      action_taken: {
        ticket_id: ticket.id,
        short_id: shortId,
        requested_action: decision.action,
        action: effectiveAction,
        result: actionResult,
        target_role: targetRole,
        guard_applied: effectiveAction !== decision.action,
        used_target_context: !!targetCtx,
      },
    });

    console.log(`✅ Тікет ${shortId} оброблено. Дія: ${effectiveAction}. Закрито: ${ticketClosed}`);

    return jsonResponse({
      success: true,
      ticket_id: ticket.id,
      short_id: shortId,
      action: effectiveAction,
      result: actionResult,
      status: ticketClosed ? "closed" : "in_progress",
    });
  } catch (error) {
    console.error("❌ Критична помилка:", error);
    return jsonResponse({ error: (error as Error).message || "Internal server error" }, 500);
  }
});