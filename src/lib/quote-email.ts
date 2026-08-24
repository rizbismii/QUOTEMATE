import { formatDate } from "./format";
import { formatMoney, greeting, gstLabel, lineAmount, registrationNumberLabel, taxNumberLabel, totals } from "./money";
import type { Business, Customer, Quote } from "./types";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function lines(value: string): string {
  return esc(value).replace(/\r?\n/g, "<br>");
}

export function quoteActionUrl(viewUrl: string, action: "accept" | "decline"): string {
  const join = viewUrl.includes("?") ? "&" : "?";
  return `${viewUrl}${join}a=${action}`;
}

export function quoteEmailHtml(input: {
  quote: Quote;
  business: Business;
  customer: Customer;
  viewUrl: string;
  inlineImages?: boolean;
}): string {
  const { quote, business, customer, viewUrl } = input;
  const inlineImages = input.inlineImages !== false;
  const money = totals(quote.lineItems, business.country, business.gstRegistered);
  const acceptUrl = quoteActionUrl(viewUrl, "accept");
  const declineUrl = quoteActionUrl(viewUrl, "decline");
  const city = (business.city || (business.country === "NZ" ? "New Zealand" : "Australia")).toUpperCase();
  const valid = formatDate(quote.validUntil, business.country);
  const logo =
    inlineImages && business.logoDataUrl
      ? `<img src="${business.logoDataUrl}" alt="${esc(business.name)}" width="160" style="max-height:56px;max-width:160px;display:block;">`
      : `<div style="font-size:22px;font-weight:700;letter-spacing:-0.03em;">${esc(business.name)}</div>
       <div style="font-size:11px;letter-spacing:0.16em;color:#6b645c;margin-top:4px;">${esc(city)}</div>`;

  const photos =
    inlineImages && quote.photos.length
      ? quote.photos
          .slice(0, 3)
          .map(
            (photo) =>
              `<img src="${photo.dataUrl}" alt="${esc(photo.name)}" width="170" style="width:170px;height:128px;object-fit:cover;border-radius:8px;display:inline-block;margin:0 6px 6px 0;">`,
          )
          .join("")
      : quote.photos.length
        ? `<p style="font-size:13px;color:#6b645c;">Site photos are on the quote page.</p>`
        : "";

  const items = quote.lineItems
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e6dccb;">
            <div style="font-weight:600;">${esc(item.description)}</div>
            <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#6b645c;">${esc(item.kind)}</div>
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #e6dccb;white-space:nowrap;">${esc(String(item.quantity))} ${esc(item.unit)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e6dccb;white-space:nowrap;">${esc(formatMoney(item.unitPrice, business.country))}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e6dccb;text-align:right;font-weight:600;white-space:nowrap;">${esc(formatMoney(lineAmount(item), business.country))}</td>
        </tr>`,
    )
    .join("");

  const taxLine =
    business.gstRegistered && business.taxNumber
      ? `${esc(taxNumberLabel(business.country))} ${esc(business.taxNumber)}`
      : "Not GST registered";
  const registration = business.registrationNumber
    ? `${esc(registrationNumberLabel(business.country))} ${esc(business.registrationNumber)}<br>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Quote ${esc(quote.number)}</title>
</head>
<body style="margin:0;padding:0;background:#f1eadc;color:#1c1814;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1eadc;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fffcf6;border-radius:16px;padding:32px 28px;">
          <tr>
            <td>
              <table role="presentation" width="100%">
                <tr>
                  <td valign="top">${logo}</td>
                  <td valign="top" align="right">
                    <div style="font-size:28px;font-weight:700;letter-spacing:0.04em;">QUOTE</div>
                    <div style="font-weight:700;margin-top:4px;">${esc(quote.number)}</div>
                    <div style="font-size:12px;color:#6b645c;margin-top:4px;">Valid until ${esc(valid)}</div>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #e6dccb;margin:24px 0;">
              <table role="presentation" width="100%">
                <tr>
                  <td valign="top" width="50%" style="padding-right:12px;font-size:14px;">
                    <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b645c;font-weight:700;">From</div>
                    <div style="font-weight:700;margin-top:6px;">${esc(business.name)}</div>
                    <div>${esc(business.ownerName)}</div>
                    <div style="color:#3f3832;">${lines(business.address)}</div>
                    ${registration}
                    <div style="color:#3f3832;">${esc(business.phone)}</div>
                    <div style="color:#3f3832;">${esc(business.email)}</div>
                    <div style="color:#3f3832;margin-top:6px;">${taxLine}</div>
                  </td>
                  <td valign="top" width="50%" style="padding-left:12px;font-size:14px;">
                    <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b645c;font-weight:700;">Bill to</div>
                    <div style="font-weight:700;margin-top:6px;">${esc(customer.name)}</div>
                    <div style="color:#3f3832;">${esc(quote.jobAddress)}</div>
                    <div style="color:#3f3832;">${esc(customer.email)}</div>
                    <div style="color:#3f3832;">${esc(customer.phone)}</div>
                  </td>
                </tr>
              </table>
              <h1 style="font-size:26px;line-height:1.2;margin:28px 0 8px;">${esc(quote.title)}</h1>
              <p style="font-size:14px;line-height:1.55;color:#3f3832;margin:0 0 16px;">${lines(quote.description)}</p>
              ${photos ? `<div style="margin:16px 0;">${photos}</div>` : ""}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:8px;">
                <tr>
                  <td style="padding-bottom:8px;border-bottom:1px solid #e6dccb;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b645c;font-weight:700;">Item</td>
                  <td style="padding-bottom:8px;border-bottom:1px solid #e6dccb;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b645c;font-weight:700;">Qty</td>
                  <td style="padding-bottom:8px;border-bottom:1px solid #e6dccb;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b645c;font-weight:700;">Rate</td>
                  <td style="padding-bottom:8px;border-bottom:1px solid #e6dccb;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b645c;font-weight:700;text-align:right;">Amount</td>
                </tr>
                ${items}
              </table>
              <table role="presentation" width="280" align="right" style="margin-top:16px;font-size:14px;">
                <tr>
                  <td>Subtotal (ex GST)</td>
                  <td align="right">${esc(formatMoney(money.subtotal, business.country))}</td>
                </tr>
                <tr>
                  <td>${esc(business.gstRegistered ? gstLabel(business.country) : "GST (n/a)")}</td>
                  <td align="right">${esc(formatMoney(money.gst, business.country))}</td>
                </tr>
                <tr>
                  <td style="padding-top:8px;border-top:1px solid #1c1814;font-size:20px;font-weight:700;">Total</td>
                  <td align="right" style="padding-top:8px;border-top:1px solid #1c1814;font-size:20px;font-weight:700;">${esc(formatMoney(money.total, business.country, true))}</td>
                </tr>
              </table>
              <div style="clear:both;"></div>
              <table role="presentation" align="center" style="margin:36px auto 12px;">
                <tr>
                  <td align="center" style="padding:0 6px;">
                    <a href="${esc(acceptUrl)}" style="background:#e24a1b;color:#ffffff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:700;display:inline-block;font-size:15px;">Accept</a>
                  </td>
                  <td align="center" style="padding:0 6px;">
                    <a href="${esc(declineUrl)}" style="background:#fffcf6;color:#1c1814;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:700;display:inline-block;font-size:15px;border:1px solid #e6dccb;">Decline</a>
                  </td>
                </tr>
              </table>
              <p style="text-align:center;font-size:12px;color:#6b645c;margin:8px 0 0;">
                Questions? Call ${esc(business.ownerName)} on ${esc(business.phone)}
              </p>
              <p style="text-align:center;font-size:12px;color:#6b645c;margin:24px 0 0;">
                This is a quote, not a tax invoice. GST is ${business.gstRegistered ? "included at the rate for" : "not charged —"}
                ${business.country === "NZ" ? "New Zealand" : "Australia"}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function quoteMailtoText(input: {
  quote: Quote;
  business: Business;
  customer: Customer;
  viewUrl: string;
  totalLabel: string;
}): string {
  const { quote, business, customer, viewUrl, totalLabel } = input;
  const who = customer.name.split(" ")[0] || "there";
  return [
    `${greeting(business.country)} ${who},`,
    "",
    "View quote:",
    viewUrl,
    "",
    "Accept:",
    quoteActionUrl(viewUrl, "accept"),
    "",
    "Decline:",
    quoteActionUrl(viewUrl, "decline"),
    "",
    `${business.name} has sent quote ${quote.number}.`,
    quote.title,
    totalLabel,
    `Valid until ${formatDate(quote.validUntil, business.country)}.`,
    "",
    "If this email looks plain, tap the message and paste — the formatted quote with Accept and Decline is already copied.",
  ].join("\n");
}

export function quoteEmailText(input: {
  quote: Quote;
  business: Business;
  customer: Customer;
  viewUrl: string;
}): string {
  const { quote, business, customer, viewUrl } = input;
  const money = totals(quote.lineItems, business.country, business.gstRegistered);
  const acceptUrl = quoteActionUrl(viewUrl, "accept");
  const declineUrl = quoteActionUrl(viewUrl, "decline");
  const items = quote.lineItems
    .map(
      (item) =>
        `${item.description} (${item.kind}) — ${item.quantity} ${item.unit} × ${formatMoney(item.unitPrice, business.country)} = ${formatMoney(lineAmount(item), business.country)}`,
    )
    .join("\n");
  return [
    `${greeting(business.country)} ${customer.name.split(" ")[0] || "there"},`,
    "",
    `QUOTE ${quote.number}`,
    `Valid until ${formatDate(quote.validUntil, business.country)}`,
    "",
    `From: ${business.name}`,
    business.ownerName,
    business.address,
    business.phone,
    business.email,
    business.gstRegistered && business.taxNumber
      ? `${taxNumberLabel(business.country)} ${business.taxNumber}`
      : "Not GST registered",
    "",
    `Bill to: ${customer.name}`,
    quote.jobAddress,
    customer.email,
    customer.phone,
    "",
    quote.title,
    quote.description,
    "",
    items,
    "",
    `Subtotal (ex GST): ${formatMoney(money.subtotal, business.country)}`,
    `${business.gstRegistered ? gstLabel(business.country) : "GST (n/a)"}: ${formatMoney(money.gst, business.country)}`,
    `Total: ${formatMoney(money.total, business.country, true)}`,
    "",
    "Accept",
    acceptUrl,
    "",
    "Decline",
    declineUrl,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

