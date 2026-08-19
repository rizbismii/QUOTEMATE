import { formatMoney, gstLabel, totals } from "./money";
import { formatDate } from "./format";
import type { Business, Customer, Invoice } from "./types";

export function accountantCsv(
  invoices: Invoice[],
  customers: Customer[],
  business: Business,
): string {
  const header = [
    "Date",
    "Invoice",
    "Customer",
    "Description",
    "Country",
    "Subtotal ex GST",
    gstLabel(business.country),
    "Total inc GST",
    "Status",
    "Paid date",
    "Due date",
  ];

  const rows = invoices.map((invoice) => {
    const customer = customers.find((item) => item.id === invoice.customerId);
    const money = totals(invoice.lineItems, business.country, business.gstRegistered);
    return [
      formatDate(invoice.issuedAt, business.country),
      invoice.number,
      customer?.name ?? "",
      invoice.title.replaceAll(",", " "),
      business.country,
      money.subtotal.toFixed(2),
      money.gst.toFixed(2),
      money.total.toFixed(2),
      invoice.status,
      invoice.paidAt ? formatDate(invoice.paidAt, business.country) : "",
      formatDate(invoice.dueAt, business.country),
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  return `\uFEFF${csv}`;
}

export function downloadText(filename: string, contents: string, mime = "text/csv;charset=utf-8"): void {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function gstSummary(
  invoices: Invoice[],
  business: Business,
): { collected: number; outstanding: number; paidCount: number; unpaidCount: number } {
  let collected = 0;
  let outstanding = 0;
  let paidCount = 0;
  let unpaidCount = 0;
  for (const invoice of invoices) {
    const money = totals(invoice.lineItems, business.country, business.gstRegistered);
    if (invoice.status === "paid") {
      collected += money.gst;
      paidCount += 1;
    } else {
      outstanding += money.gst;
      unpaidCount += 1;
    }
  }
  return { collected, outstanding, paidCount, unpaidCount };
}

export { formatMoney };
