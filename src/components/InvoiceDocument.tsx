import { formatDate } from "@/lib/format";
import { formatMoney, gstLabel, lineAmount, taxNumberLabel, totals } from "@/lib/money";
import { invoiceIsOverdue } from "@/lib/money";
import type { Business, Customer, Invoice } from "@/lib/types";
import { Wordmark } from "./Logo";
import { StatusBadge } from "./StatusBadge";

export function InvoiceDocument({
  invoice,
  business,
  customer,
}: {
  invoice: Invoice;
  business: Business;
  customer?: Customer;
}) {
  const money = totals(invoice.lineItems, business.country, business.gstRegistered);
  const status = invoice.status === "paid" ? "paid" : invoiceIsOverdue(invoice) ? "overdue" : "unpaid";

  return (
    <article className="doc-sheet mx-auto max-w-2xl bg-card p-6 text-ink sm:p-10">
      <header className="flex items-start justify-between gap-4 border-b border-line pb-6">
        <Wordmark />
        <div className="text-right">
          <p className="font-display text-3xl tracking-tight">TAX INVOICE</p>
          <p className="text-sm font-semibold">{invoice.number}</p>
          <div className="mt-1 flex justify-end">
            <StatusBadge kind="invoice" status={status} />
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-steel">From</p>
          <p className="mt-1 font-semibold">{business.name}</p>
          <p>{business.ownerName}</p>
          <p className="text-ink-soft">{business.address}</p>
          {business.gstRegistered && business.taxNumber ? (
            <p className="mt-1">
              {taxNumberLabel(business.country)} {business.taxNumber}
            </p>
          ) : (
            <p className="mt-1 text-ink-soft">Not GST registered</p>
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-steel">To</p>
          <p className="mt-1 font-semibold">{customer?.name ?? "Customer"}</p>
          <p className="text-ink-soft">{invoice.jobAddress}</p>
          <p className="mt-3 text-ink-soft">Issued {formatDate(invoice.issuedAt, business.country)}</p>
          <p className="text-ink-soft">Due {formatDate(invoice.dueAt, business.country)}</p>
        </div>
      </div>

      <h2 className="mt-8 font-display text-2xl tracking-tight">{invoice.title}</h2>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-steel">
            <th className="pb-2 font-semibold">Item</th>
            <th className="pb-2 font-semibold">Qty</th>
            <th className="pb-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item) => (
            <tr key={item.id} className="border-b border-line/70">
              <td className="py-2.5">{item.description}</td>
              <td className="py-2.5">
                {item.quantity} {item.unit}
              </td>
              <td className="py-2.5 text-right">{formatMoney(lineAmount(item), business.country)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal (ex GST)</span>
          <span>{formatMoney(money.subtotal, business.country)}</span>
        </div>
        <div className="flex justify-between">
          <span>{business.gstRegistered ? gstLabel(business.country) : "GST (n/a)"}</span>
          <span>{formatMoney(money.gst, business.country)}</span>
        </div>
        <div className="flex justify-between border-t border-ink pt-2 font-display text-xl">
          <span>Amount due</span>
          <span>{formatMoney(money.total, business.country, true)}</span>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-paper p-4 text-sm">
        <p className="font-semibold">Pay by bank transfer</p>
        <p className="mt-1 text-ink-soft">{business.bankName}</p>
        <p className="font-mono text-base">{business.bankAccount || "Add account in settings"}</p>
        <p className="mt-2 text-xs text-steel">Use {invoice.number} as the reference.</p>
      </div>
    </article>
  );
}
