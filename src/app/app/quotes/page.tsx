"use client";

import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney, totals } from "@/lib/money";
import { quoteViewPath } from "@/lib/paths";
import { useStore } from "@/lib/store";
import Link from "next/link";

export default function QuotesPage() {
  const quotes = useStore((s) => s.quotes);
  const customers = useStore((s) => s.customers);
  const business = useStore((s) => s.business);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Quotes</h1>
          <p className="text-sm text-steel">{quotes.length} in this job book</p>
        </div>
        <Link href="/app/quotes/new" className="text-sm font-semibold text-rust">
          New
        </Link>
      </div>
      <div className="space-y-2">
        {quotes.map((quote) => {
          const customer = customers.find((item) => item.id === quote.customerId);
          const money = totals(quote.lineItems, business.country, business.gstRegistered);
          return (
            <Link
              key={quote.id}
              href={quoteViewPath(quote.id)}
              className="block rounded-2xl border border-line bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{quote.title}</p>
                  <p className="text-xs text-steel">
                    {quote.number} · {customer?.name} · {quote.jobAddress}
                  </p>
                </div>
                <StatusBadge status={quote.status} />
              </div>
              <p className="mt-2 font-display text-xl">{formatMoney(money.total, business.country, true)}</p>
            </Link>
          );
        })}
        {quotes.length === 0 ? (
          <p className="text-sm text-steel">No quotes yet. Snap a job from the driveway.</p>
        ) : null}
      </div>
    </div>
  );
}
