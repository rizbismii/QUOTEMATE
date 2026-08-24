import type { Country, Invoice, LineItem } from "./types";

export const GST_RATE: Record<Country, number> = {
  NZ: 0.15,
  AU: 0.1,
};

export const CURRENCY: Record<Country, { code: string; symbol: string; name: string }> = {
  NZ: { code: "NZD", symbol: "$", name: "New Zealand dollar" },
  AU: { code: "AUD", symbol: "$", name: "Australian dollar" },
};

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineAmount(item: Pick<LineItem, "quantity" | "unitPrice">): number {
  return roundMoney(item.quantity * item.unitPrice);
}

export function gstRate(country: Country, gstRegistered: boolean): number {
  if (!gstRegistered) return 0;
  return GST_RATE[country];
}

export function totals(
  lineItems: Pick<LineItem, "quantity" | "unitPrice">[] | undefined,
  country: Country,
  gstRegistered: boolean,
) {
  const subtotal = roundMoney((lineItems ?? []).reduce((sum, item) => sum + lineAmount(item), 0));
  const rate = gstRate(country === "AU" ? "AU" : "NZ", gstRegistered);
  const gst = roundMoney(subtotal * rate);
  const total = roundMoney(subtotal + gst);
  return { subtotal, gst, total, rate };
}

export function formatMoney(value: number, country: Country, withCode = false): string {
  const safe = country === "AU" ? "AU" : "NZ";
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString(safe === "NZ" ? "en-NZ" : "en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const signed = value < 0 ? `-${CURRENCY[safe].symbol}${formatted}` : `${CURRENCY[safe].symbol}${formatted}`;
  return withCode ? `${signed} ${CURRENCY[safe].code}` : signed;
}

export function gstLabel(country: Country): string {
  return country === "NZ" ? "GST (15%)" : "GST (10%)";
}

export function taxNumberLabel(country: Country): string {
  return country === "NZ" ? "GST number" : "ABN";
}

export function taxNumberHint(country: Country): string {
  return country === "NZ"
    ? "IRD GST number printed on quotes and invoices."
    : "11-digit ABN — this is the GST number used on quotes.";
}

export function taxNumberPlaceholder(country: Country): string {
  return country === "NZ" ? "123-456-789" : "12 345 678 901";
}

export function registrationNumberLabel(country: Country): string {
  return country === "NZ" ? "NZBN / company number" : "ACN";
}

export function registrationNumberHint(country: Country): string {
  return country === "NZ"
    ? "Optional. New Zealand Business Number or Companies Office number."
    : "Optional. Australian Company Number.";
}

export function registrationNumberPlaceholder(country: Country): string {
  return country === "NZ" ? "9429041234567" : "123 456 789";
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function todayIso(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function financialYear(country: Country, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (country === "NZ") {
    if (month >= 3) {
      return {
        start: new Date(year, 3, 1),
        end: new Date(year + 1, 2, 31, 23, 59, 59),
        label: `${year}/${String(year + 1).slice(2)}`,
      };
    }
    return {
      start: new Date(year - 1, 3, 1),
      end: new Date(year, 2, 31, 23, 59, 59),
      label: `${year - 1}/${String(year).slice(2)}`,
    };
  }

  if (month >= 6) {
    return {
      start: new Date(year, 6, 1),
      end: new Date(year + 1, 5, 30, 23, 59, 59),
      label: `${year}/${String(year + 1).slice(2)}`,
    };
  }
  return {
    start: new Date(year - 1, 6, 1),
    end: new Date(year, 5, 30, 23, 59, 59),
    label: `${year - 1}/${String(year).slice(2)}`,
  };
}

export function inRange(isoDate: string, start: Date, end: Date): boolean {
  const time = new Date(`${isoDate}T12:00:00`).getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function invoiceIsOverdue(invoice: Pick<Invoice, "status" | "dueAt">, now = new Date()): boolean {
  if (invoice.status === "paid") return false;
  return invoice.dueAt < todayIso(now);
}

export function greeting(country: Country): string {
  return country === "NZ" ? "Kia ora" : "G'day";
}
