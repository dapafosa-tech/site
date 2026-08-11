// supabase/functions/ai-support-agent/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ============================================================
// ПРАВИЛА БАНУ ЗА РОЛЯМИ (без змін від попередньої версії)
// - owner: ШІ НІКОЛИ не банить. Завжди ескалація до людини.
// - admin: бан можливий ЛИШЕ якщо є підтверджені докази:
//     (a) масовий бан 10+ людей за останню 1 хвилину цим адміном, або
//     (b) активна мультиакаунт-мітка на цього адміна (очікує розбору).
//   Інакше — ескалація, а не бан.
// - moderator / user: ШІ вирішує сам, як і раніше.
// ============================================================

const MASS_BAN_THRESHOLD = 10;
const MASS_BAN_WINDOW_MIN = 1;
const DEFAULT_GRACE_MINUTES = 10;

// ============================================================
// БАЗА ЗНАНЬ ПРО ФУНКЦІОНАЛ САЙТУ.
// Без цього ШІ не міг відповісти навіть на прості питання типу
// "як додати людину в організацію" чи "як змінити пошту" - він знав
// лише те, що написано в самому тикеті, без жодного уявлення про сайт.
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
  ввести 6-значний код, який дає керівник організації.
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
action: "close" або "reply"). Розслідування (requires_investigation: true)
потрібне лише для скарг на когось, підозри на порушення, бану/розбану,
багоюзу тощо - НЕ для звичайних питань "як користуватись сайтом".
`;

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

async function getAiSupportSettings() {
  const { data } = await supabase
    .from("system_settings")
    .select("key, value")
    .in("key", ["ai_support_enabled", "ai_support_grace_minutes"]);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return {
    enabled: map["ai_support_enabled"] !== "false",
    graceMinutes: parseInt(map["ai_support_grace_minutes"] || String(DEFAULT_GRACE_MINUTES), 10) || DEFAULT_GRACE_MINUTES,
  };
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
    const { ticket_id } = await req.json();
    if (!ticket_id) {
      return new Response(JSON.stringify({ error: "ticket_id required" }), { status: 400 });
    }

    const settings = await getAiSupportSettings();
    if (!settings.enabled) {
      return new Response(JSON.stringify({ message: "AI support disabled" }), { status: 200 });
    }

    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .select(`
        *,
        user:user_id (id, full_name, email, role, is_banned, ban_reason, banned_until, reg_ip)
      `)
      .eq("id", ticket_id)
      .single();

    if (error || !ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), { status: 404 });
    }

    if (ticket.status === "closed" || ticket.status === "resolved") {
      return new Response(JSON.stringify({ message: "Already closed" }), { status: 200 });
    }

    // Якщо в тикеті вже є повідомлення від людини-персоналу - ШІ не втручається
    const { data: existingMessages } = await supabase
      .from("support_messages")
      .select("sender_type")
      .eq("ticket_id", ticket.id);
    const humanStaffReplied = (existingMessages ?? []).some((m) =>
      ["owner", "admin", "moderator"].includes(m.sender_type)
    );
    if (humanStaffReplied) {
      return new Response(JSON.stringify({ message: "Human staff already handling" }), { status: 200 });
    }

    const targetCtx = await getTargetUserContext(ticket.related_report_id);

    // Отримуємо організації автора тикету
    const { data: orgs } = await supabase
      .from("org_members")
      .select("organizations(name, type, status)")
      .eq("user_id", ticket.user_id);

    // Історія самого автора тикету
    const { data: history } = await supabase
      .from("ai_actions_log")
      .select("*")
      .eq("target_user_id", ticket.user_id)
      .order("created_at", { ascending: false })
      .limit(5);

    const targetBlock = targetCtx
      ? `
ЦЕЙ ТИКЕТ ПОВ'ЯЗАНИЙ ЗІ СКАРГОЮ. Дані ЦІЛЬОВОГО користувача скарги (не автора тикету):
- Ім'я: ${targetCtx.target?.full_name || targetCtx.target?.email}
- Роль: ${targetCtx.target?.role}
- Причина скарги: ${targetCtx.report.reason}
- Забанений зараз: ${targetCtx.target?.is_banned ? "Так (" + targetCtx.target?.ban_reason + ")" : "Ні"}
- reg_ip: ${targetCtx.target?.reg_ip || "немає"}
- last_ip: ${targetCtx.target?.last_ip || "немає"}
- Акаунти з тим самим IP (reg_ip/last_ip): ${
          targetCtx.ipMatches.length
            ? targetCtx.ipMatches.map((u: any) => `${u.full_name || u.email} (id:${u.id}${u.is_banned ? ", вже забанений" : ""})`).join("; ")
            : "немає збігів"
        }
- Історія дій ШІ проти цього користувача: ${
          targetCtx.banHistory.length
            ? targetCtx.banHistory.map((h: any) => `${new Date(h.created_at).toLocaleString("uk-UA")}: ${h.action_type}`).join("; ")
            : "немає"
        }
`
      : "";

    const context = `
ТИКЕТ #${ticket.id}
Від: ${ticket.user?.full_name || ticket.user?.email}
Тема: ${ticket.subject}
Повідомлення: ${ticket.message}
Тип: ${ticket.type || "general"}

ІНФО ПРО АВТОРА ТИКЕТУ:
- Роль: ${ticket.user?.role || "user"}
- Забанений: ${ticket.user?.is_banned ? "Так" : "Ні"}
- IP: ${ticket.user?.reg_ip || "Невідомо"}

ОРГАНІЗАЦІЇ АВТОРА:
${orgs?.map((o: any) => `- ${o.organizations?.name || "Невідома"}`).join("\n") || "Немає"}

ІСТОРІЯ АВТОРА:
${history?.map((h: any) => `- ${new Date(h.created_at).toLocaleString("uk-UA")}: ${h.action_type}`).join("\n") || "Немає"}
${targetBlock}
${SITE_KNOWLEDGE}
ТИ АГЕНТ ПІДТРИМКИ. Спочатку визнач, чи цей тикет можна вирішити ОДРАЗУ (проста відповідь по системі - див. довідку вище, без потреби перевіряти людину/логи/IP/докази), чи потрібне РОЗСЛІДУВАННЯ (скарги на когось, підозра на порушення, багоюз, бан на 5+ днів тощо).

ВІДПОВІДАЙ ТІЛЬКИ JSON:
{
  "requires_investigation": true/false,
  "action": "close|reply|ban|unban|escalate",
  "message": "відповідь користувачеві",
  "ban_days": число (якщо ban),
  "reason": "коротка причина"
}`;

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) {
      throw new Error("GROQ_API_KEY not set");
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Ти агент підтримки Typebiz. У тебе є довідка про функціонал сайту в повідомленні користувача - користуйся нею для точних відповідей. Відповідай тільки JSON." },
          { role: "user", content: context }
        ],
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: "json_object" }
      }),
    });

    const result = await groqResponse.json();
    const decision = JSON.parse(result.choices[0].message.content);

    // ============================================================
    // ФАЗА ВІТАННЯ: якщо тикет потребує розслідування, ще не було
    // привітання, і грейс-період ще не вийшов - надсилаємо ТІЛЬКИ
    // вітання і чекаємо. Ніяких дій (бан/закриття) не виконуємо.
    // ============================================================
    const createdAt = new Date(ticket.created_at).getTime();
    const minutesSinceCreated = (Date.now() - createdAt) / 60000;
    const graceElapsed = minutesSinceCreated >= settings.graceMinutes;

    if (decision.requires_investigation && !ticket.ai_greeted) {
      const greeting = `Вітаю! Я передивився ваш тикет і взявся за перевірку. Це вимагає додаткового розгляду (${targetCtx ? "перевірка користувача, IP, історії" : "деталей"}), тож зачекайте, будь ласка — я повернусь з відповіддю.`;
      await supabase.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_id: null,
        sender_type: "ai",
        message: greeting,
        created_at: new Date().toISOString(),
      });
      await supabase
        .from("support_tickets")
        .update({ status: "in_progress", ai_greeted: true, updated_at: new Date().toISOString() })
        .eq("id", ticket.id);

      await supabase.from("ai_actions_log").insert({
        action_type: "support_ticket",
        target_user_id: ticket.user_id,
        related_ticket_id: ticket.id,
        related_report_id: ticket.related_report_id,
        ai_reasoning: `[Тикет #${ticket.id}] Вітання надіслано, розслідування заплановане (грейс-період: ${settings.graceMinutes} хв.)`,
        action_taken: { ticket_id: ticket.id, phase: "greeting" },
      });

      return new Response(JSON.stringify({
        success: true,
        ticket_id: ticket.id,
        action: "greeting",
        result: "Вітання надіслано, очікує грейс-період"
      }), { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }

    // Якщо потребує розслідування, вітання вже було, але грейс-період ще не минув - чекаємо далі
    if (decision.requires_investigation && ticket.ai_greeted && !graceElapsed) {
      return new Response(JSON.stringify({
        success: true,
        ticket_id: ticket.id,
        action: "waiting",
        result: `Очікування грейс-періоду (лишилось ~${Math.ceil(settings.graceMinutes - minutesSinceCreated)} хв.)`
      }), { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }

    // requires_investigation === false -> проста відповідь, можна відповісти і закрити одразу,
    // навіть на першому виклику, без грейс-періоду і без вітання.

    let actionResult = "";
    const targetRole = ticket.user?.role || "user";

    // ============================================================
    // ЗАСТОСОВУЄМО РОЛЬОВІ ГАРАНТІЇ ПЕРЕД ВИКОНАННЯМ БАНУ
    // ============================================================
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

    // Виконуємо дії
    if (effectiveAction === "ban") {
      const days = decision.ban_days || 3;
      const until = new Date(Date.now() + days * 86400000).toISOString();
      await supabase
        .from("users")
        .update({ is_banned: true, ban_reason: `[Тикет #${ticket.id}] ${decision.reason}`, banned_until: until })
        .eq("id", ticket.user_id);
      actionResult = `Заблоковано на ${days} днів (тикет #${ticket.id})`;
    } else if (effectiveAction === "unban") {
      await supabase
        .from("users")
        .update({ is_banned: false, ban_reason: null, banned_until: null })
        .eq("id", ticket.user_id);
      actionResult = `Розблоковано (тикет #${ticket.id})`;
    } else if (effectiveAction === "escalate") {
      const { data: staff } = await supabase
        .from("users")
        .select("id")
        .in("role", ["owner", "admin"]);
      for (const s of staff ?? []) {
        await supabase.from("notifications").insert({
          user_id: s.id,
          title: "🔺 Потрібен ручний розгляд тикета",
          message: `Тикет #${ticket.id} від ${ticket.user?.full_name || ticket.user?.email}. ${guardNote || decision.reason}`,
          type: "system_alert",
          link: `/tickets/${ticket.id}`,
        });
      }
      actionResult = guardNote || "Ескальовано до людини";
    }

    if (decision.message) {
      await supabase.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_id: null,
        sender_type: "ai",
        message: decision.message,
        created_at: new Date().toISOString()
      });
    }

    if (effectiveAction === "close") {
      await supabase
        .from("support_tickets")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", ticket.id);
    }

    await supabase.from("ai_actions_log").insert({
      action_type: "support_ticket",
      target_user_id: ticket.user_id,
      related_ticket_id: ticket.id,
      related_report_id: ticket.related_report_id,
      ai_reasoning: `[Тикет #${ticket.id}] ${decision.reason || "Оброблено"}${guardNote ? " | " + guardNote : ""}`,
      action_taken: {
        ticket_id: ticket.id,
        requested_action: decision.action,
        action: effectiveAction,
        result: actionResult,
        target_role: targetRole,
        guard_applied: effectiveAction !== decision.action,
        used_target_context: !!targetCtx,
      }
    });

    return new Response(JSON.stringify({
      success: true,
      ticket_id: ticket.id,
      action: effectiveAction,
      result: actionResult
    }), {
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
