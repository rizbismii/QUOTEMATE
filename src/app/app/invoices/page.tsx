"use client";

import { PlanGate } from "@/components/PlanGate";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney, invoiceIsOverdue, totals } from "@/lib/money";
import { invoiceViewPath } from "@/lib/paths";
import { useStore } from "@/lib/store";
import Link from "next/link";

export default function InvoicesPage() {
  const invoices = useStore((s) => s.invoices);
  const customers = useStore((s) => s.customers);
  const business = useStore((s) => s.business);

  return (
    <PlanGate feature="invoices">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Invoices</h1>
        <p className="mb-4 text-sm text-steel">Converted from accepted quotes. GST calculated for {business.country}.</p>
        <div className="space-y-2">
          {invoices.map((invoice) => {
            const customer = customers.find((item) => item.id === invoice.customerId);
            const money = totals(invoice.lineItems, business.country, business.gstRegistered);
            const status = invoice.status === "paid" ? "paid" : invoiceIsOverdue(invoice) ? "overdue" : "unpaid";
            return (
              <Link
                key={invoice.id}
                href={invoiceViewPath(invoice.id)}
                className="block rounded-2xl border border-line bg-card p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{invoice.number}</p>
                    <p className="text-xs text-steel">
                      {customer?.name} · due {invoice.dueAt}
                    </p>
                  </div>
                  <StatusBadge kind="invoice" status={status} />
                </div>
                <p className="mt-2 font-display text-xl">{formatMoney(money.total, business.country, true)}</p>
              </Link>
            );
          })}
          {invoices.length === 0 ? (
            <p className="text-sm text-steel">Accept a quote, then convert it in one tap.</p>
          ) : null}
        </div>
      </div>
    </PlanGate>
  );
}
