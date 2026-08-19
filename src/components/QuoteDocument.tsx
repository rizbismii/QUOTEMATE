import { formatDate } from "@/lib/format";
import { formatMoney, gstLabel, lineAmount, taxNumberLabel, totals } from "@/lib/money";
import type { Business, Customer, Quote } from "@/lib/types";
import { Wordmark } from "./Logo";

export function QuoteDocument({
  quote,
  business,
  customer,
}: {
  quote: Quote;
  business: Business;
  customer?: Customer;
}) {
  const money = totals(quote.lineItems, business.country, business.gstRegistered);

  return (
    <article className="doc-sheet mx-auto max-w-2xl bg-card p-6 text-ink sm:p-10">
      <header className="flex items-start justify-between gap-4 border-b border-line pb-6">
        <Wordmark />
        <div className="text-right">
          <p className="font-display text-3xl tracking-tight">QUOTE</p>
          <p className="text-sm font-semibold">{quote.number}</p>
          <p className="text-xs text-steel">Valid until {formatDate(quote.validUntil, business.country)}</p>
        </div>
      </header>

      <div className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-steel">From</p>
          <p className="mt-1 font-semibold">{business.name}</p>
          <p>{business.ownerName}</p>
          <p className="text-ink-soft">{business.address}</p>
          <p className="text-ink-soft">{business.phone}</p>
          <p className="text-ink-soft">{business.email}</p>
          {business.gstRegistered && business.taxNumber ? (
            <p className="mt-1 text-ink-soft">
              {taxNumberLabel(business.country)} {business.taxNumber}
            </p>
          ) : (
            <p className="mt-1 text-ink-soft">Not GST registered</p>
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-steel">Bill to</p>
          <p className="mt-1 font-semibold">{customer?.name ?? "Customer"}</p>
          <p className="text-ink-soft">{quote.jobAddress}</p>
          <p className="text-ink-soft">{customer?.email}</p>
          <p className="text-ink-soft">{customer?.phone}</p>
        </div>
      </div>

      <h2 className="mt-8 font-display text-2xl tracking-tight">{quote.title}</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{quote.description}</p>

      {quote.photos.length ? (
        <div className="mt-5 grid grid-cols-3 gap-2">
          {quote.photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={photo.dataUrl}
              alt={photo.name}
              className="aspect-[4/3] w-full rounded-lg object-cover"
            />
          ))}
        </div>
      ) : null}

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-steel">
            <th className="pb-2 font-semibold">Item</th>
            <th className="pb-2 font-semibold">Qty</th>
            <th className="pb-2 font-semibold">Rate</th>
            <th className="pb-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {quote.lineItems.map((item) => (
            <tr key={item.id} className="border-b border-line/70">
              <td className="py-2.5">
                <p className="font-medium">{item.description}</p>
                <p className="text-[11px] uppercase tracking-wide text-steel">{item.kind}</p>
              </td>
              <td className="py-2.5">
                {item.quantity} {item.unit}
              </td>
              <td className="py-2.5">{formatMoney(item.unitPrice, business.country)}</td>
              <td className="py-2.5 text-right font-medium">
                {formatMoney(lineAmount(item), business.country)}
              </td>
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
          <span>Total</span>
          <span>{formatMoney(money.total, business.country, true)}</span>
        </div>
      </div>

      {quote.notes ? (
        <p className="mt-8 text-sm text-ink-soft">
          <span className="font-semibold text-ink">Notes. </span>
          {quote.notes}
        </p>
      ) : null}

      <p className="mt-10 text-xs text-steel">
        This is a quote, not a tax invoice. GST is {business.gstRegistered ? "included at the rate for" : "not charged —"}{" "}
        {business.country === "NZ" ? "New Zealand" : "Australia"}.
      </p>
    </article>
  );
}
