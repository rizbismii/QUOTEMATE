"use client";

import { formatMoney, totals } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { publicInvoicePath, publicPayPath, publicQuotePath } from "@/lib/paths";
import { payMethodLabel } from "@/lib/pay";
import { buildShareUrl, mailSubject, publicUrl, shareMessage } from "@/lib/share";
import { openQuoteHtmlEmail, quoteEmailHtml } from "@/lib/quote-email";
import { useStore } from "@/lib/store";
import type { Invoice, Quote, SendChannel } from "@/lib/types";
import { Copy, Mail, MessageCircle, MessageSquare, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";

export function SendSheet({
  kind,
  quote,
  invoice,
}: {
  kind: "quote" | "invoice" | "reminder";
  quote?: Quote;
  invoice?: Invoice;
}) {
  const business = useStore((s) => s.business);
  const customers = useStore((s) => s.customers);
  const sendQuote = useStore((s) => s.sendQuote);
  const sendReminder = useStore((s) => s.sendReminder);
  const [copied, setCopied] = useState(false);
  const [emailNote, setEmailNote] = useState("");

  const record = quote ?? invoice;
  if (!record) return null;
  const customer = customers.find((item) => item.id === record.customerId);
  if (!customer) return null;

  const money = totals(record.lineItems, business.country, business.gstRegistered);
  const path = quote ? publicQuotePath(quote.publicToken) : publicInvoicePath(invoice!.publicToken);
  const url = publicUrl(path);
  const payUrl = invoice ? publicUrl(publicPayPath(invoice.publicToken)) : undefined;
  const dueOrValid = quote
    ? formatDate(quote.validUntil, business.country)
    : formatDate(invoice!.dueAt, business.country);
  const body = shareMessage({
    kind,
    number: record.number,
    title: quote?.title ?? invoice!.title,
    totalLabel: formatMoney(money.total, business.country, true),
    dueOrValid,
    business,
    customer,
    url,
    payUrl,
    payMethodsLabel: invoice ? payMethodLabel(business) : undefined,
  });
  const subject = mailSubject(kind, record.number, business.name);
  const cc = [business.email, ...business.ccEmails].filter(Boolean).join(", ");

  function mark(channel: SendChannel) {
    if (quote) sendQuote(quote.id, channel);
    if (invoice && kind === "reminder") sendReminder(invoice.id, channel);
    if (invoice && kind === "invoice") sendReminder(invoice.id, channel);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${body}`);
    mark("link");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function open(channel: SendChannel) {
    if (!customer) return;
    if (channel === "email" && quote) {
      mark("email");
      const html = quoteEmailHtml({
        quote,
        business,
        customer,
        viewUrl: url,
      });
      const result = await openQuoteHtmlEmail({
        to: customer.email,
        cc: cc || undefined,
        subject,
        html,
        fileName: `${quote.number}.eml`,
      });
      if (result === "downloaded") {
        setEmailNote("Quote email saved. Open the .eml file in Gmail or Mail to send the quote with Accept and Decline buttons.");
      } else if (result === "shared") {
        setEmailNote("Choose Gmail or Mail to send the quote with Accept and Decline buttons.");
      }
      return;
    }
    const href = buildShareUrl({
      channel,
      country: business.country,
      customer,
      business,
      subject,
      body,
    });
    mark(channel);
    if (href) window.open(href, "_blank");
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="font-display text-lg">Send to customer</p>
      <p className="mt-1 text-xs text-steel">
        Email sends the full quote with Accept and Decline buttons. SMS and WhatsApp open on this
        phone. Creator copy goes to {cc || "your business email"}.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" onClick={() => open("email")}>
          <Mail className="h-4 w-4" /> Email
        </Button>
        <Button type="button" variant="secondary" onClick={() => open("sms")}>
          <MessageSquare className="h-4 w-4" /> SMS
        </Button>
        <Button type="button" variant="secondary" onClick={() => open("whatsapp")}>
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </Button>
        <Button type="button" variant="secondary" onClick={copyLink}>
          {copied ? <LinkIcon className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy message"}
        </Button>
      </div>
      {invoice && payUrl ? (
        <p className="mt-3 break-all text-xs text-steel">
          Pay button: <span className="font-semibold text-ink">{payUrl}</span>
        </p>
      ) : null}
      {emailNote ? <p className="mt-3 text-xs text-ink-soft">{emailNote}</p> : null}
      {quote ? (
        <iframe
          title="Quote email preview"
          className="mt-3 h-[420px] w-full rounded-xl border border-line bg-paper"
          srcDoc={quoteEmailHtml({ quote, business, customer, viewUrl: url })}
        />
      ) : (
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-paper px-3 py-2 text-xs text-ink-soft">
          {body}
        </pre>
      )}
    </div>
  );
}
