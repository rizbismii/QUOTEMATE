import { formatMoney, lineAmount, totals } from "@/lib/money";
import { cn } from "@/lib/cn";
import type { Business, LineItem } from "@/lib/types";

export function MoneySummary({
  items,
  business,
  className,
}: {
  items: LineItem[];
  business: Business;
  className?: string;
}) {
  const money = totals(items, business.country, business.gstRegistered);
  return (
    <div className={cn("rounded-2xl border border-line bg-paper/80 p-4 text-sm", className)}>
      <Row label="Subtotal (ex GST)" value={formatMoney(money.subtotal, business.country)} />
      <Row
        label={business.gstRegistered ? (business.country === "NZ" ? "GST 15%" : "GST 10%") : "GST (not registered)"}
        value={formatMoney(money.gst, business.country)}
      />
      <div className="mt-2 flex items-center justify-between border-t border-line pt-2 font-display text-lg">
        <span>Total</span>
        <span>{formatMoney(money.total, business.country, true)}</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5 text-ink-soft">
      <span>{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

export function LineAmount({ item, country }: { item: LineItem; country: Business["country"] }) {
  return <span>{formatMoney(lineAmount(item), country)}</span>;
}
