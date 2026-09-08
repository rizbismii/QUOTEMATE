import { corsHeaders } from "./cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const MAIL_FROM = Deno.env.get("MAIL_FROM") ?? "QuoteSnap <onboarding@resend.dev>";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "method" }, { status: 405, headers: corsHeaders });
  }
  if (!RESEND_API_KEY) {
    return Response.json({ error: "mail-not-configured", ok: false }, { status: 501, headers: corsHeaders });
  }

  const body = await req.json().catch(() => null);
  const to = String(body?.to || "").trim();
  const subject = String(body?.subject || "").trim();
  const html = String(body?.html || "");
  const text = String(body?.text || "");
  if (!to || !subject || (!html && !text)) {
    return Response.json({ error: "invalid", ok: false }, { status: 400, headers: corsHeaders });
  }

  const payload: Record<string, unknown> = {
    from: MAIL_FROM,
    to: [to],
    subject,
    html: html || undefined,
    text: text || undefined,
    reply_to: body?.replyTo || undefined,
  };
  if (body?.cc) payload.cc = [String(body.cc)];

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!sent.ok) {
    const detail = await sent.text();
    return Response.json({ error: "send-failed", detail, ok: false }, { status: 502, headers: corsHeaders });
  }
  return Response.json({ ok: true }, { headers: corsHeaders });
});
