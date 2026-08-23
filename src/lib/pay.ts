import { CURRENCY, totals } from "./money";
import { publicPayPath } from "./paths";
import type { Business, Invoice } from "./types";

export function payMethods(business: Business) {
  return {
    visa: business.acceptVisa !== false,
    mastercard: business.acceptMastercard !== false,
    bank: business.acceptBankTransfer !== false,
  };
}

export function payMethodLabel(business: Business): string {
  const methods = payMethods(business);
  const parts: string[] = [];
  if (methods.visa) parts.push("Visa");
  if (methods.mastercard) parts.push("Mastercard");
  if (methods.bank) parts.push("bank transfer");
  if (!parts.length) return "your usual payment method";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} or ${parts[parts.length - 1]}`;
}

export function normalizeHttpUrl(raw?: string | null): string {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function decoratePayButtonUrl(
  url: string,
  invoice: Pick<Invoice, "number">,
  amount: number,
  currency: string,
): string {
  const href = normalizeHttpUrl(url);
  if (!href) return "";
  try {
    const parsed = new URL(href);
    if (!parsed.searchParams.has("amount")) parsed.searchParams.set("amount", amount.toFixed(2));
    if (!parsed.searchParams.has("currency")) parsed.searchParams.set("currency", currency);
    if (!parsed.searchParams.has("reference")) parsed.searchParams.set("reference", invoice.number);
    return parsed.toString();
  } catch {
    return href;
  }
}

export function invoiceTotal(invoice: Invoice, business: Business): number {
  return totals(invoice.lineItems, business.country, business.gstRegistered).total;
}

export function cardCheckoutUrl(business: Business, invoice: Invoice): string {
  const country = business.country === "AU" ? "AU" : "NZ";
  return decoratePayButtonUrl(
    business.payButtonUrl ?? "",
    invoice,
    invoiceTotal(invoice, business),
    CURRENCY[country].code,
  );
}

export function customerPayPath(token: string): string {
  return publicPayPath(token);
}
