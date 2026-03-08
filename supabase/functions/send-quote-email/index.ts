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

    if (RESEND_API_KEY) {
      // Send via Resend
      const emailBody = `
Новый запрос цены от ${name}

Компания: ${company || "—"}
Email: ${email}
Телефон: ${phone || "—"}

Номера деталей: ${partNumbers}
Количество: ${quantities || "—"}

Сообщение:
${message || "—"}
      `.trim();

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SibMicro <noreply@sibmicro.ru>",
          to: [RECIPIENT],
          subject: `Запрос цены: ${partNumbers.substring(0, 60)}`,
          text: emailBody,
          reply_to: email,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Resend error:", text);
        // Still return success since data is saved in DB
      }
    } else {
      console.log("RESEND_API_KEY not configured. Quote request saved to DB only.");
      console.log(`Quote from ${name} (${email}): ${partNumbers}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Send quote email error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
