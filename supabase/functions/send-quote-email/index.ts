import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RECIPIENT = "sales@sibmicro.ru";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, company, partNumbers, quantities, message } = await req.json();

    if (!name || !email || !partNumbers) {
      return new Response(
        JSON.stringify({ error: "name, email, and partNumbers are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const sanitize = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

    const emailBody = `
Новый запрос от ${name}

Компания: ${company || "—"}
Email: ${email}
Телефон: ${phone || "—"}

Номера деталей: ${partNumbers}
Количество: ${quantities || "—"}

Сообщение:
${message || "—"}
    `.trim();

    const subject = sanitize(`Запрос: ${partNumbers.substring(0, 60)}`);

    if (RESEND_API_KEY) {
      // 1) Email to sales
      const salesRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SibMicro <noreply@sibmicro.ru>",
          to: [RECIPIENT],
          subject,
          text: emailBody,
          reply_to: email,
        }),
      });

      if (!salesRes.ok) {
        console.error("Resend sales error:", await salesRes.text());
      }

      // 2) Confirmation to client
      const clientBody = `
Здравствуйте, ${name}!

Мы получили ваш запрос и скоро свяжемся с вами.

Детали запроса:
- Номера деталей: ${partNumbers}
- Количество: ${quantities || "—"}
${message ? `- Сообщение: ${message}` : ""}

С уважением,
Команда SibMicro
      `.trim();

      const clientRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SibMicro <noreply@sibmicro.ru>",
          to: [email],
          subject: "SibMicro — Ваш запрос получен",
          text: clientBody,
        }),
      });

      if (!clientRes.ok) {
        console.error("Resend client error:", await clientRes.text());
      }
    } else {
      console.log("RESEND_API_KEY not configured.");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Send quote email error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});