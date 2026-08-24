import { greeting } from "./money";
import { formatDate } from "./format";
import { toE164 } from "./format";
import { withBase } from "./paths";
import { quoteActionUrl } from "./quote-email";
import type { Business, Country, Customer, SendChannel } from "./types";

export function shareMessage(input: {
  kind: "quote" | "invoice" | "reminder";
  number: string;
  title: string;
  totalLabel: string;
  dueOrValid: string;
  business: Business;
  customer: Customer;
  url: string;
  payUrl?: string;
  payMethodsLabel?: string;
}): string {
  const hi = greeting(input.business.country);
  const who = input.customer.name.split(" ")[0] || "there";
  const methods = input.payMethodsLabel || "Visa, Mastercard or bank transfer";
  const pay = input.payUrl || input.url;
  if (input.kind === "quote") {
    return [
      `${hi} ${who},`,
      "",
      `${input.business.name} has sent quote ${input.number}.`,
      input.title,
      input.totalLabel,
      "Valid until ${input.dueOrValid}.",
      "",
      "Accept:",
      quoteActionUrl(input.url, "accept"),
      "",
      "Decline:",
      quoteActionUrl(input.url, "decline"),
    ].join("\n");
  }
  if (input.kind === "reminder") {
    return [
      `${hi} ${who},`,
      "",
      `Friendly reminder that invoice ${input.number} (${input.totalLabel}) was due ${input.dueOrValid}.`,
      "",
      `Pay now (${methods}):`,
      pay,
      "",
      input.business.name,
    ].join("\n");
  }
  return [
    `${hi} ${who},`,
    "",
    `Invoice ${input.number} from ${input.business.name} for ${input.title} is ${input.totalLabel}, due ${input.dueOrValid}.`,
    "",
    `Pay now (${methods}):`,
    pay,
  ].join("\n");
}

export function mailSubject(kind: "quote" | "invoice" | "reminder", number: string, businessName: string): string {
  if (kind === "quote") return `Quote ${number} from ${businessName}`;
  if (kind === "reminder") return `Reminder: invoice ${number} from ${businessName}`;
  return `Invoice ${number} from ${businessName}`;
}

export function mailtoHref(to: string, subject: string, body: string, cc?: string): string {
  const query = [
    `subject=${encodeURIComponent(subject)}`,
    `body=${encodeURIComponent(body)}`,
  ];
  if (cc) query.push(`cc=${encodeURIComponent(cc)}`);
  return `mailto:${encodeURIComponent(to)}?${query.join("&")}`;
}

export function buildShareUrl(input: {
  channel: SendChannel;
  country: Country;
  customer: Customer;
  business: Business;
  subject: string;
  body: string;
}): string | null {
  const cc = [input.business.email, ...input.business.ccEmails.filter(Boolean)].filter(Boolean).join(",");
  if (input.channel === "email") {
    return mailtoHref(input.customer.email, input.subject, input.body, cc || undefined);
  }
  if (input.channel === "sms") {
    const body = encodeURIComponent(input.body);
    return `sms:${toE164(input.customer.phone, input.country)}?&body=${body}`;
  }
  if (input.channel === "whatsapp") {
    return `https://wa.me/${toE164(input.customer.phone, input.country)}?text=${encodeURIComponent(input.body)}`;
  }
  return null;
}

export function publicUrl(path: string): string {
  const prefixed = withBase(path);
  if (typeof window === "undefined") return prefixed;
  return `${window.location.origin}${prefixed}`;
}

export { formatDate };
