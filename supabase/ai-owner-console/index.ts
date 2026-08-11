// supabase/functions/ai-owner-request/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ============================================================
// CORS ЗАГОЛОВКИ
// ============================================================
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req) => {
  // ============================================================
  // ОБРОБКА OPTIONS (preflight)
  // ============================================================
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: CORS_HEADERS,
    });
  }

  // ============================================================
  // ОСНОВНА ЛОГІКА
  // ============================================================
  try {
    const { request_id } = await req.json();
    
    if (!request_id) {
      return new Response(
        JSON.stringify({ error: "request_id required" }),
        { 
          status: 400, 
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
        }
      );
    }

    // Отримуємо запит
    const { data: request, error } = await supabase
      .from("ai_owner_requests")
      .select("*, requester:requested_by (id, role, full_name)")
      .eq("id", request_id)
      .single();

    if (error || !request) {
      return new Response(
        JSON.stringify({ error: "Request not found" }),
        { 
          status: 404, 
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
        }
      );
    }

    // Перевіряємо роль
    if (request.requester?.role !== "owner") {
      await supabase
        .from("ai_owner_requests")
        .update({ 
          status: "error", 
          response: "Відмовлено: лише засновник може використовувати ШІ-консоль" 
        })
        .eq("id", request_id);
      
      return new Response(
        JSON.stringify({ error: "Forbidden: owner only" }),
        { 
          status: 403, 
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
        }
      );
    }

    const prompt = request.prompt || "";
    const groqKey = Deno.env.get("GROQ_API_KEY");
    
    if (!groqKey) {
      await supabase
        .from("ai_owner_requests")
        .update({ 
          status: "error", 
          response: "GROQ_API_KEY не налаштовано" 
        })
        .eq("id", request_id);
      
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY not set" }),
        { 
          status: 500, 
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
        }
      );
    }

    // Оновлюємо статус
    await supabase
      .from("ai_owner_requests")
      .update({ status: "working", greeting: "🔍 Аналізую запит, зачекайте..." })
      .eq("id", request_id);

    // ============================================================
    // РОЗПІЗНАВАННЯ КОМАНД
    // ============================================================
    
    // 1. ПЕРЕВІРКА ТІКЕТА
    const ticketMatch = prompt.match(/тікет\s*#?\s*([a-f0-9\-]{20,})/i);
    if (ticketMatch) {
      const ticketId = ticketMatch[1];
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("*, user:user_id (id, full_name, email, role)")
        .eq("id", ticketId)
        .single();

      if (!ticket) {
        await supabase
          .from("ai_owner_requests")
          .update({ 
            status: "done", 
            response: `❌ Тікет #${ticketId.substring(0, 8)} не знайдено` 
          })
          .eq("id", request_id);
        
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const { data: messages } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true })
        .limit(20);

      const shortId = '#' + ticketId.replace(/-/g, '').slice(0, 8);
      
      let response = `📋 **Тікет ${shortId}**\n\n`;
      response += `**Тема:** ${ticket.subject || 'Без теми'}\n`;
      response += `**Від:** ${ticket.user?.full_name || ticket.user?.email || 'Невідомо'}\n`;
      response += `**Статус:** ${ticket.status || 'open'}\n`;
      response += `**Пріоритет:** ${ticket.priority || 'medium'}\n`;
      response += `**Створено:** ${new Date(ticket.created_at).toLocaleString('uk-UA')}\n\n`;
      response += `**Повідомлення:**\n---\n`;
      
      if (messages && messages.length > 0) {
        for (const msg of messages) {
          const sender = msg.sender_type === 'ai' ? '🤖 ШІ' : 
                         msg.sender_type === 'user' ? '👤 Користувач' :
                         msg.sender_type === 'admin' ? '⭐ Адмін' :
                         msg.sender_type === 'owner' ? '👑 Засновник' : '📌 Система';
          response += `${sender}: ${msg.message}\n`;
        }
      } else {
        response += `(повідомлень немає)\n`;
      }

      response += `\n---\n💡 **Що бажаєте зробити?** Можу закрити, передати адмінам, або відповісти.`;

      await supabase
        .from("ai_owner_requests")
        .update({ status: "done", response: response })
        .eq("id", request_id);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 2. ЗАКРИТИ ТІКЕТ
    const closeMatch = prompt.match(/закри(й|ти|вай)\s*тікет\s*#?\s*([a-f0-9\-]{20,})/i);
    if (closeMatch) {
      const ticketId = closeMatch[2];
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", ticketId)
        .single();

      if (!ticket) {
        await supabase
          .from("ai_owner_requests")
          .update({ 
            status: "done", 
            response: `❌ Тікет #${ticketId.substring(0, 8)} не знайдено` 
          })
          .eq("id", request_id);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      await supabase.from("support_messages").insert({
        ticket_id: ticketId,
        sender_id: null,
        sender_type: "ai",
        message: "👑 Тікет закрито засновником через ШІ-консоль.",
        created_at: new Date().toISOString()
      });

      await supabase
        .from("support_tickets")
        .update({ status: "closed", updated_at: new Date().toISOString() })
        .eq("id", ticketId);

      const shortId = '#' + ticketId.replace(/-/g, '').slice(0, 8);
      await supabase
        .from("ai_owner_requests")
        .update({ 
          status: "done", 
          response: `✅ Тікет ${shortId} закрито` 
        })
        .eq("id", request_id);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 3. ВІДПОВІСТИ В ТІКЕТ
    const replyMatch = prompt.match(/відповісти\s+(?:в|у)\s+тікет(?:і|)\s*#?\s*([a-f0-9\-]{20,})\s*:\s*(.+)/is);
    if (replyMatch) {
      const ticketId = replyMatch[1];
      const replyMessage = replyMatch[2].trim();

      if (!replyMessage) {
        await supabase
          .from("ai_owner_requests")
          .update({ 
            status: "done", 
            response: "❌ Введіть текст відповіді" 
          })
          .eq("id", request_id);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", ticketId)
        .single();

      if (!ticket) {
        await supabase
          .from("ai_owner_requests")
          .update({ 
            status: "done", 
            response: `❌ Тікет #${ticketId.substring(0, 8)} не знайдено` 
          })
          .eq("id", request_id);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      await supabase.from("support_messages").insert({
        ticket_id: ticketId,
        sender_id: null,
        sender_type: "owner",
        message: `👑 **Засновник через ШІ-консоль:**\n${replyMessage}`,
        created_at: new Date().toISOString()
      });

      const shortId = '#' + ticketId.replace(/-/g, '').slice(0, 8);
      await supabase
        .from("ai_owner_requests")
        .update({ 
          status: "done", 
          response: `✅ Відповідь надіслано в тікет ${shortId}` 
        })
        .eq("id", request_id);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 4. ЗВИЧАЙНИЙ ЗАПИТ
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `Ти ШІ-консоль для засновника Typebiz. Відповідай українською. Ти можеш:
1. Показувати тікет: "покажи тікет #id"
2. Закривати тікет: "закрий тікет #id"
3. Відповідати в тікет: "відповісти в тікет #id: текст"
4. Банити/розбанити користувачів
5. Змінювати ролі
Якщо не команда - просто відповідай на запит.` 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error("Groq API error: " + errorText);
    }

    const result = await groqResponse.json();
    const aiResponse = result.choices?.[0]?.message?.content || "Не вдалося обробити запит.";

    await supabase
      .from("ai_owner_requests")
      .update({ 
        status: "done", 
        response: aiResponse 
      })
      .eq("id", request_id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Помилка:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { 
        status: 500, 
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
      }
    );
  }
});