"use client";

import { Button } from "@/components/Button";
import { PlanGate } from "@/components/PlanGate";
import { accountantCsv, downloadText, gstSummary } from "@/lib/export";
import { financialYear, formatMoney, inRange, totals } from "@/lib/money";
import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";

type RangeKey = "month" | "fy" | "all";

export default function RecordsPage() {
  const invoices = useStore((s) => s.invoices);
  const customers = useStore((s) => s.customers);
  const business = useStore((s) => s.business);
  const [range, setRange] = useState<RangeKey>("fy");

  const filtered = useMemo(() => {
    const now = new Date();
    if (range === "all") return invoices;
    if (range === "month") {
      return invoices.filter((invoice) => {
        const date = new Date(`${invoice.issuedAt}T12:00:00`);
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      });
    }
    const fy = financialYear(business.country, now);
    return invoices.filter((invoice) => inRange(invoice.issuedAt, fy.start, fy.end));
  }, [business.country, invoices, range]);

  const fy = financialYear(business.country);
  const gst = gstSummary(filtered, business);
  const sales = filtered.reduce(
    (sum, invoice) => sum + totals(invoice.lineItems, business.country, business.gstRegistered).total,
    0,
  );

  return (
    <PlanGate feature="invoices">
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Records</h1>
          <p className="text-sm text-ink-soft">
            GST on sales for {business.country === "NZ" ? "IRD" : "ATO"} — not a full set of books. Export this for your accountant or Xero.
          </p>
        </div>
        <div className="flex gap-2">
          {(
            [
              ["month", "This month"],
              ["fy", `FY ${fy.label}`],
              ["all", "All"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                range === key ? "bg-ink text-paper" : "border border-line bg-card"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card label="Sales inc GST" value={formatMoney(sales, business.country)} />
          <Card label="GST collected" value={formatMoney(gst.collected, business.country)} />
          <Card label="GST still unpaid" value={formatMoney(gst.outstanding, business.country)} />
          <Card label="Paid / unpaid" value={`${gst.paidCount} / ${gst.unpaidCount}`} />
        </div>
        <PlanGate feature="payments">
          <Button
            variant="secondary"
            onClick={() =>
              downloadText(
                `quotesnap-${business.country}-${fy.label}.csv`,
                accountantCsv(filtered, customers, business),
              )
            }
          >
            Export CSV for accountant
          </Button>
        </PlanGate>
        <p className="text-xs text-steel">
          {business.country === "NZ"
            ? "New Zealand financial year runs 1 April – 31 March. GST is 15% on registered sales."
            : "Australian financial year runs 1 July – 30 June. GST is 10% on registered sales."}
        </p>
      </div>
    </PlanGate>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-steel">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}
