"use client";

import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { formatMoney, invoiceIsOverdue, totals } from "@/lib/money";
import { formatQuoteAllowance } from "@/lib/plans";
import { useStore } from "@/lib/store";
import { ArrowRight, Camera } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const business = useStore((s) => s.business);
  const quotes = useStore((s) => s.quotes);
  const invoices = useStore((s) => s.invoices);
  const customers = useStore((s) => s.customers);
  const activities = useStore((s) => s.activities);

  const unpaid = invoices.filter((invoice) => invoice.status !== "paid");
  const unpaidTotal = unpaid.reduce(
    (sum, invoice) => sum + totals(invoice.lineItems, business.country, business.gstRegistered).total,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-steel">
          {business.country === "NZ" ? "Kia ora" : "G'day"}, {business.ownerName.split(" ")[0] || "there"}
        </p>
        <h1 className="font-display text-3xl tracking-tight">{business.name || "Your trade"}</h1>
        <p className="text-sm text-ink-soft">
          {formatQuoteAllowance(business.plan, quotes)} · {business.city} {business.country}
        </p>
      </div>

      <Link
        href="/app/quotes/new"
        className="flex items-center justify-between rounded-3xl bg-ink p-5 text-paper shadow-lg"
      >
        <div>
          <p className="font-display text-2xl">New quote</p>
          <p className="text-sm text-paper/70">Photos + voice. GST calculated.</p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-full bg-rust">
          <Camera className="h-6 w-6" />
        </span>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-steel">Unpaid</p>
          <p className="mt-1 font-display text-2xl">{formatMoney(unpaidTotal, business.country)}</p>
          <p className="text-xs text-steel">{unpaid.length} invoices</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-steel">Open quotes</p>
          <p className="mt-1 font-display text-2xl">
            {quotes.filter((quote) => quote.status === "sent" || quote.status === "draft").length}
          </p>
          <p className="text-xs text-steel">Drafts and sent</p>
        </div>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-xl">Recent quotes</h2>
          <Link href="/app/quotes" className="text-sm font-semibold text-rust">
            See all
          </Link>
        </div>
        <div className="space-y-2">
          {quotes.slice(0, 4).map((quote) => {
            const customer = customers.find((item) => item.id === quote.customerId);
            const money = totals(quote.lineItems, business.country, business.gstRegistered);
            return (
              <Link
                key={quote.id}
                href={`/app/quotes/${quote.id}`}
                className="flex items-center justify-between rounded-2xl border border-line bg-card p-3"
              >
                <div>
                  <p className="font-semibold">{quote.title}</p>
                  <p className="text-xs text-steel">
                    {quote.number} · {customer?.name}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={quote.status} />
                  <p className="mt-1 text-sm font-semibold">{formatMoney(money.total, business.country)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-xl">Money in</h2>
          <Link href="/app/invoices" className="text-sm font-semibold text-rust">
            Invoices
          </Link>
        </div>
        <div className="space-y-2">
          {invoices.slice(0, 3).map((invoice) => {
            const customer = customers.find((item) => item.id === invoice.customerId);
            const money = totals(invoice.lineItems, business.country, business.gstRegistered);
            const status = invoice.status === "paid" ? "paid" : invoiceIsOverdue(invoice) ? "overdue" : "unpaid";
            return (
              <Link
                key={invoice.id}
                href={`/app/invoices/${invoice.id}`}
                className="flex items-center justify-between rounded-2xl border border-line bg-card p-3"
              >
                <div>
                  <p className="font-semibold">{invoice.number}</p>
                  <p className="text-xs text-steel">{customer?.name}</p>
                </div>
                <div className="text-right">
                  <StatusBadge kind="invoice" status={status} />
                  <p className="mt-1 text-sm font-semibold">{formatMoney(money.total, business.country)}</p>
                </div>
              </Link>
            );
          })}
          {invoices.length === 0 ? (
            <p className="text-sm text-steel">Accepted quotes convert to invoices on the Business plan.</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-display text-xl">Activity</h2>
        <ul className="space-y-2 text-sm">
          {activities.slice(0, 5).map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 text-ink-soft">
              <span>{item.message}</span>
              <span className="shrink-0 text-xs text-steel">{formatDateTime(item.at, business.country)}</span>
            </li>
          ))}
        </ul>
      </section>

      <Link href="/app/plan" className="flex items-center justify-between text-sm font-semibold text-rust">
        Plans from free to $29.99 <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
