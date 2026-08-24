"use client";

import { formatMoney, totals } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { publicInvoicePath, publicPayPath, publicQuotePath } from "@/lib/paths";
import { payMethodLabel } from "@/lib/pay";
import { quoteEmailHtml, quoteMailtoText } from "@/lib/quote-email";
import { quoteEmailFileName, openQuoteEmail } from "@/lib/send-email";
import { buildShareUrl, mailSubject, publicUrl, shareMessage } from "@/lib/share";
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
  const [emailHint, setEmailHint] = useState("");

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
  const previewHtml = quote
    ? quoteEmailHtml({ quote, business, customer, viewUrl: url })
    : undefined;
  const sendHtml = quote
    ? quoteEmailHtml({ quote, business, customer, viewUrl: url, inlineImages: false })
    : undefined;
  const body = quote
    ? quoteMailtoText({
        quote,
        business,
        customer,
        viewUrl: url,
        totalLabel: formatMoney(money.total, business.country, true),
      })
    : shareMessage({
        kind,
        number: record.number,
        title: invoice!.title,
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
    if (channel === "email" && quote && sendHtml) {
      mark(channel);
      const how = await openQuoteEmail({
        from: business.email,
        to: customer.email,
        cc: cc || undefined,
        subject,
        html: sendHtml,
        text: body,
        fileName: quoteEmailFileName(quote.number),
      });
      setEmailHint(
        how === "shared"
          ? "Choose Mail or Gmail in the share list. The quote is HTML with Accept and Decline."
          : "Formatted quote copied. If Gmail looks plain, tap the message and paste.",
      );
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
    if (!href) return;
    window.open(href, "_blank");
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="font-display text-lg">Send to customer</p>
      <p className="mt-1 text-xs text-steel">
        Email sends the formatted quote with Accept and Decline. Creator copy goes to{" "}
        {cc || "your business email"}.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" onClick={() => void open("email")}>
          <Mail className="h-4 w-4" /> Email
        </Button>
        <Button type="button" variant="secondary" onClick={() => void open("sms")}>
          <MessageSquare className="h-4 w-4" /> SMS
        </Button>
        <Button type="button" variant="secondary" onClick={() => void open("whatsapp")}>
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </Button>
        <Button type="button" variant="secondary" onClick={() => void copyLink()}>
          {copied ? <LinkIcon className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy message"}
        </Button>
      </div>
      {emailHint ? <p className="mt-3 text-xs font-semibold text-rust">{emailHint}</p> : null}
      {invoice && payUrl ? (
        <p className="mt-3 break-all text-xs text-steel">
          Pay button: <span className="font-semibold text-ink">{payUrl}</span>
        </p>
      ) : null}
      {previewHtml ? (
        <iframe
          title="Quote email preview"
          className="mt-3 h-[420px] w-full rounded-xl border border-line bg-paper"
          srcDoc={previewHtml}
        />
      ) : (
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-paper px-3 py-2 text-xs text-ink-soft">
          {body}
        </pre>
      )}
    </div>
  );
}
