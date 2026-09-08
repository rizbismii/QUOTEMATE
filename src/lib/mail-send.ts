import { uid } from "./ids";
import { gmailLinkStatus, sendViaGmail } from "./gmail";
import { buildQuoteEml, openQuoteEmail, quoteEmailFileName } from "./send-email";
import { getSupabase } from "./supabase";
import type { MailItem } from "./types";

export type DeliverHow = "gmail" | "cloud" | "shared" | "mailto";

export interface MailPayload {
  from: string;
  to: string;
  cc?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  fileName?: string;
}

export async function sendViaCloudMail(payload: MailPayload): Promise<boolean> {
  if (process.env.VITEST) return false;
  const client = getSupabase();
  if (!client) return false;
  const { data, error } = await client.functions.invoke("send-mail", {
    body: {
      to: payload.to,
      cc: payload.cc,
      replyTo: payload.replyTo || payload.from,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    },
  });
  if (error) return false;
  return Boolean(data && (data as { ok?: boolean }).ok !== false);
}

export async function deliverHtmlEmail(payload: MailPayload): Promise<DeliverHow> {
  const eml = buildQuoteEml(payload);

  if (gmailLinkStatus().linked) {
    try {
      await sendViaGmail(eml);
      return "gmail";
    } catch {
      // Token may have expired; fall through to other senders.
    }
  }

  try {
    if (await sendViaCloudMail(payload)) return "cloud";
  } catch {
    // Function not deployed yet.
  }

  return openQuoteEmail({
    ...payload,
    fileName: payload.fileName || quoteEmailFileName(payload.subject),
  });
}

export function sentMailItem(input: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  quoteId?: string;
  invoiceId?: string;
}): MailItem {
  return {
    id: uid("mail"),
    at: new Date().toISOString(),
    folder: "sent",
    from: input.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    quoteId: input.quoteId,
    invoiceId: input.invoiceId,
    status: "sent",
  };
}

export function mailHint(how: DeliverHow): string {
  if (how === "gmail" || how === "cloud") {
    return "Sent. The customer gets the formatted quote with Accept and Decline. A copy is in Mail.";
  }
  if (how === "shared") {
    return "Choose Mail or Gmail. The quote is HTML with Accept and Decline.";
  }
  return "Formatted quote copied. If Gmail looks plain, tap the message and paste — or link Gmail in Settings to send from the app.";
}
