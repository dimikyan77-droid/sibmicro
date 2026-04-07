import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get active notifications
    const { data: notifications, error: nErr } = await supabase
      .from("restock_notifications")
      .select("id, part_number, email")
      .eq("active", true)
      .is("notified_at", null);

    if (nErr) throw nErr;
    if (!notifications?.length) {
      return new Response(JSON.stringify({ message: "No pending notifications", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get unique part numbers
    const partNumbers = [...new Set(notifications.map((n) => n.part_number))];

    // Check inventory for these parts
    const { data: inStock } = await supabase
      .from("inventory")
      .select("part_number, quantity")
      .in("part_number", partNumbers)
      .gt("quantity", 0);

    const availableParts = new Set((inStock || []).map((i) => i.part_number));

    // Filter notifications for parts now in stock
    const toNotify = notifications.filter((n) => availableParts.has(n.part_number));

    if (!toNotify.length) {
      return new Response(JSON.stringify({ message: "No parts restocked yet", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let sent = 0;

    for (const n of toNotify) {
      if (resendKey) {
        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fff;font-family:Arial,sans-serif;">
<div style="max-width:500px;margin:24px auto;padding:24px;border:1px solid #d4e4d4;border-radius:12px;">
  <h2 style="color:#1a5c2a;margin:0 0 12px;">Компонент снова в наличии!</h2>
  <p style="color:#333;font-size:14px;margin:0 0 16px;">
    Деталь <strong style="font-family:monospace;color:#1a5c2a;">${n.part_number}</strong> появилась на складе SibMicro.
  </p>
  <a href="https://sibmicro.lovable.app/catalog?q=${encodeURIComponent(n.part_number)}"
     style="display:inline-block;background:#5da31a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
    Перейти к товару
  </a>
  <p style="color:#999;font-size:11px;margin:20px 0 0;">SibMicro · sibmicro.ru</p>
</div>
</body></html>`;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "SibMicro <noreply@sibmicro.ru>",
            to: [n.email],
            subject: `${n.part_number} — снова в наличии!`,
            html,
          }),
        });

        if (res.ok) sent++;
        else console.error("Resend error:", await res.text());
      }

      // Mark as notified
      await supabase
        .from("restock_notifications")
        .update({ notified_at: new Date().toISOString(), active: false })
        .eq("id", n.id);
    }

    return new Response(
      JSON.stringify({ message: `Notified ${sent} subscribers`, sent, total: toNotify.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Restock check error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
