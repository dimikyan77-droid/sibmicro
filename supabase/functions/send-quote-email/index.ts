import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RECIPIENT = "sales@sibmicro.ru";
const LOGO_URL = "https://sibmicro.lovable.app/assets/logo-BsTFk0nt.png";

const PRIMARY = "#1a5c2a";
const PRIMARY_DARK = "#0f3d1a";
const ACCENT = "#5da31a";
const BG_LIGHT = "#f7faf7";
const BORDER_COLOR = "#d4e4d4";
const TEXT_DARK = "#1a3322";
const TEXT_MUTED = "#5c7a5c";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

function salesEmailHtml(p: {
  name: string; email: string; phone?: string; company?: string;
  partNumbers: string; quantities?: string; message?: string;
}): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
<tr><td align="center" style="padding:24px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background:${PRIMARY_DARK};padding:24px 32px;border-radius:8px 8px 0 0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><img src="${LOGO_URL}" alt="SibMicro" height="32" style="display:block;height:32px;"></td>
    <td align="right" style="color:#a8d4a8;font-size:12px;font-family:monospace;">НОВЫЙ ЗАПРОС</td>
  </tr></table>
</td></tr>

<!-- Title bar -->
<tr><td style="background:${ACCENT};padding:12px 32px;">
  <span style="color:#ffffff;font-size:14px;font-weight:600;">📩 Запрос цены</span>
</td></tr>

<!-- Body -->
<tr><td style="background:${BG_LIGHT};padding:28px 32px;border-left:1px solid ${BORDER_COLOR};border-right:1px solid ${BORDER_COLOR};">

  <!-- Client info -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
    <tr><td colspan="2" style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${TEXT_MUTED};padding-bottom:8px;border-bottom:1px solid ${BORDER_COLOR};">Контактные данные</td></tr>
    <tr><td style="padding:8px 0;color:${TEXT_MUTED};font-size:13px;width:120px;">Имя</td><td style="padding:8px 0;color:${TEXT_DARK};font-size:14px;font-weight:600;">${escapeHtml(p.name)}</td></tr>
    <tr><td style="padding:4px 0;color:${TEXT_MUTED};font-size:13px;">Email</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(p.email)}" style="color:${PRIMARY};font-size:14px;">${escapeHtml(p.email)}</a></td></tr>
    ${p.phone ? `<tr><td style="padding:4px 0;color:${TEXT_MUTED};font-size:13px;">Телефон</td><td style="padding:4px 0;color:${TEXT_DARK};font-size:14px;">${escapeHtml(p.phone)}</td></tr>` : ""}
    ${p.company ? `<tr><td style="padding:4px 0;color:${TEXT_MUTED};font-size:13px;">Компания</td><td style="padding:4px 0;color:${TEXT_DARK};font-size:14px;">${escapeHtml(p.company)}</td></tr>` : ""}
  </table>

  <!-- Parts -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
    <tr><td colspan="2" style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${TEXT_MUTED};padding-bottom:8px;border-bottom:1px solid ${BORDER_COLOR};">Детали запроса</td></tr>
    <tr><td style="padding:8px 0;color:${TEXT_MUTED};font-size:13px;width:120px;">Детали</td><td style="padding:8px 0;color:${TEXT_DARK};font-size:14px;font-family:monospace;font-weight:600;">${escapeHtml(p.partNumbers)}</td></tr>
    ${p.quantities ? `<tr><td style="padding:4px 0;color:${TEXT_MUTED};font-size:13px;">Количество</td><td style="padding:4px 0;color:${TEXT_DARK};font-size:14px;font-family:monospace;">${escapeHtml(p.quantities)}</td></tr>` : ""}
  </table>

  ${p.message ? `
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${TEXT_MUTED};padding-bottom:8px;border-bottom:1px solid ${BORDER_COLOR};">Сообщение</td></tr>
    <tr><td style="padding:12px;margin-top:8px;background:#ffffff;border:1px solid ${BORDER_COLOR};border-radius:6px;color:${TEXT_DARK};font-size:14px;line-height:1.5;">${escapeHtml(p.message)}</td></tr>
  </table>` : ""}

</td></tr>

<!-- Footer -->
<tr><td style="background:${PRIMARY_DARK};padding:16px 32px;border-radius:0 0 8px 8px;text-align:center;">
  <span style="color:#6ba86b;font-size:11px;">SibMicro · Электронные компоненты · sibmicro.ru</span>
</td></tr>

</table>
</td></tr></table>
</body></html>`;
}

function clientEmailHtml(p: {
  name: string; partNumbers: string; quantities?: string; message?: string;
}): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
<tr><td align="center" style="padding:24px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background:${PRIMARY_DARK};padding:24px 32px;border-radius:8px 8px 0 0;text-align:center;">
  <img src="${LOGO_URL}" alt="SibMicro" height="36" style="display:inline-block;height:36px;">
</td></tr>

<!-- Accent bar -->
<tr><td style="background:${ACCENT};padding:3px 0;"></td></tr>

<!-- Body -->
<tr><td style="background:${BG_LIGHT};padding:32px;border-left:1px solid ${BORDER_COLOR};border-right:1px solid ${BORDER_COLOR};">

  <h1 style="margin:0 0 8px;font-size:20px;color:${TEXT_DARK};">Ваш запрос получен!</h1>
  <p style="margin:0 0 24px;font-size:14px;color:${TEXT_MUTED};line-height:1.5;">
    Здравствуйте, ${escapeHtml(p.name)}! Мы получили ваш запрос и свяжемся с вами в ближайшее время.
  </p>

  <!-- Details card -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BORDER_COLOR};border-radius:8px;overflow:hidden;margin-bottom:24px;">
    <tr><td style="background:${PRIMARY};padding:10px 20px;">
      <span style="color:#ffffff;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Детали запроса</span>
    </td></tr>
    <tr><td style="padding:16px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;color:${TEXT_MUTED};font-size:13px;width:110px;">Номера деталей</td>
          <td style="padding:6px 0;color:${TEXT_DARK};font-size:14px;font-family:monospace;font-weight:600;">${escapeHtml(p.partNumbers)}</td>
        </tr>
        ${p.quantities ? `<tr>
          <td style="padding:6px 0;color:${TEXT_MUTED};font-size:13px;">Количество</td>
          <td style="padding:6px 0;color:${TEXT_DARK};font-size:14px;font-family:monospace;">${escapeHtml(p.quantities)}</td>
        </tr>` : ""}
        ${p.message ? `<tr>
          <td style="padding:6px 0;color:${TEXT_MUTED};font-size:13px;vertical-align:top;">Сообщение</td>
          <td style="padding:6px 0;color:${TEXT_DARK};font-size:14px;line-height:1.5;">${escapeHtml(p.message)}</td>
        </tr>` : ""}
      </table>
    </td></tr>
  </table>

  <p style="margin:0;font-size:13px;color:${TEXT_MUTED};line-height:1.5;">
    Если у вас есть вопросы, просто ответьте на это письмо или свяжитесь с нами по адресу
    <a href="mailto:sales@sibmicro.ru" style="color:${PRIMARY};">sales@sibmicro.ru</a>.
  </p>

</td></tr>

<!-- Footer -->
<tr><td style="background:${PRIMARY_DARK};padding:20px 32px;border-radius:0 0 8px 8px;text-align:center;">
  <p style="margin:0 0 4px;color:#a8d4a8;font-size:13px;font-weight:600;">SibMicro</p>
  <p style="margin:0;color:#6ba86b;font-size:11px;">Электронные компоненты · sibmicro.ru</p>
</td></tr>

</table>
</td></tr></table>
</body></html>`;
}

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
    const subject = sanitize(`Запрос: ${partNumbers.substring(0, 60)}`);

    if (RESEND_API_KEY) {
      // 1) HTML email to sales
      const salesRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "SibMicro <noreply@sibmicro.ru>",
          to: [RECIPIENT],
          subject,
          html: salesEmailHtml({ name, email, phone, company, partNumbers, quantities, message }),
          reply_to: email,
        }),
      });
      if (!salesRes.ok) console.error("Resend sales error:", await salesRes.text());

      // 2) HTML confirmation to client
      const clientRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "SibMicro <noreply@sibmicro.ru>",
          to: [email],
          subject: "SibMicro — Ваш запрос получен",
          html: clientEmailHtml({ name, partNumbers, quantities, message }),
        }),
      });
      if (!clientRes.ok) console.error("Resend client error:", await clientRes.text());
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