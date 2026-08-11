// Supabase Edge Function: analyze-report
//
// Викликається з owner-panel.html:
//   sb.functions.invoke('analyze-report', { body: { reportId } })
//
// Що робить:
// 1. Перевіряє, що викликач авторизований і має роль admin/moderator/owner.
// 2. Дістає скаргу (reports) + короткий контекст по обох користувачах.
// 3. Питає в Groq (openai/gpt-oss-20b) оцінку ризику й коротку рекомендацію.
// 4. Пише результат у reports.ai_analysis / reports.ai_analyzed_at.
//
// Деплой:
//   supabase functions deploy analyze-report
//   supabase secrets set GROQ_API_KEY=твій_ключ_з_console.groq.com
//
// SUPABASE_URL і SUPABASE_SERVICE_ROLE_KEY підставляються автоматично
// Supabase - вручну їх задавати не треба.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    if (!GROQ_API_KEY) {
      return jsonResponse({ error: 'GROQ_API_KEY не налаштований (supabase secrets set GROQ_API_KEY=...)' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Немає авторизації' }, 401);
    }

    // Клієнт "від імені викликача" - щоб через RLS перевірити, хто він.
    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: 'Недійсна сесія' }, 401);
    }

    // Сервісний клієнт - для читання/запису в обхід RLS (нам уже відомо,
    // хто викликає, і ми самі перевіряємо роль нижче).
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from('users')
      .select('id, role')
      .eq('id', userData.user.id)
      .single();

    if (callerProfileError || !callerProfile) {
      return jsonResponse({ error: 'Профіль не знайдено' }, 403);
    }
    if (!['admin', 'moderator', 'owner'].includes(callerProfile.role)) {
      return jsonResponse({ error: 'Немає прав для AI-аналізу скарг' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const reportId = body?.reportId;
    if (!reportId) {
      return jsonResponse({ error: 'reportId обов\'язковий' }, 400);
    }

    const { data: report, error: reportError } = await adminClient
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return jsonResponse({ error: 'Скаргу не знайдено' }, 404);
    }

    const { data: fromUser } = await adminClient
      .from('users')
      .select('full_name, email, is_banned')
      .eq('id', report.from_user_id)
      .maybeSingle();

    const { data: targetUser } = await adminClient
      .from('users')
      .select('full_name, email, is_banned')
      .eq('id', report.target_user_id)
      .maybeSingle();

    // Скільки всього скарг було на цю ж людину раніше - корисний контекст для AI.
    const { count: priorReportsCount } = await adminClient
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('target_user_id', report.target_user_id);

    const systemPrompt =
      'Ти - асистент модерації для платформи Typebiz. Тобі дають скаргу користувача на іншого ' +
      'користувача. Оціни серйозність ситуації і дай коротку рекомендацію модератору. ' +
      'Відповідай ЛИШЕ у форматі JSON без жодного тексту навколо, українською мовою, у форматі: ' +
      '{"risk_level": "low" | "medium" | "high", "summary": "1-2 речення суті скарги", ' +
      '"recommendation": "1 речення - що робити модератору"}.';

    const userPrompt = [
      `Причина скарги: ${report.reason || 'не вказано'}`,
      `Опис від заявника: ${report.description || 'без опису'}`,
      `Скаржиться: ${fromUser?.full_name || fromUser?.email || 'невідомо'}`,
      `На кого: ${targetUser?.full_name || targetUser?.email || 'невідомо'} (вже заблокований: ${targetUser?.is_banned ? 'так' : 'ні'})`,
      `Кількість скарг на цього користувача всього: ${priorReportsCount ?? 'невідомо'}`,
    ].join('\n');

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      return jsonResponse({ error: 'Groq API помилка: ' + errText }, 502);
    }

    const groqData = await groqResponse.json();
    const rawContent = groqData?.choices?.[0]?.message?.content;
    if (!rawContent) {
      return jsonResponse({ error: 'Groq не повернув відповідь' }, 502);
    }

    let analysis;
    try {
      analysis = JSON.parse(rawContent);
    } catch {
      return jsonResponse({ error: 'Не вдалося розпарсити відповідь AI' }, 502);
    }

    if (!analysis.risk_level || !analysis.summary) {
      return jsonResponse({ error: 'Відповідь AI має неочікуваний формат' }, 502);
    }

    await adminClient
      .from('reports')
      .update({ ai_analysis: analysis, ai_analyzed_at: new Date().toISOString() })
      .eq('id', reportId);

    return jsonResponse({ success: true, analysis });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Невідома помилка' }, 500);
  }
});
