import { cn } from "@/lib/cn";
import type { QuoteStatus, InvoiceStatus } from "@/lib/types";

const quoteMap: Record<QuoteStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-line text-ink-soft" },
  sent: { label: "Sent", className: "bg-sky-100 text-sky-900" },
  accepted: { label: "Accepted", className: "bg-fern/15 text-fern" },
  declined: { label: "Declined", className: "bg-red-100 text-red-800" },
  expired: { label: "Expired", className: "bg-line text-steel" },
  invoiced: { label: "Invoiced", className: "bg-gold/25 text-ink" },
};

const invoiceMap: Record<InvoiceStatus, { label: string; className: string }> = {
  unpaid: { label: "Unpaid", className: "bg-amber-100 text-amber-900" },
  paid: { label: "Paid", className: "bg-fern/15 text-fern" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-800" },
};

export function StatusBadge({
  status,
  kind = "quote",
}: {
  status: QuoteStatus | InvoiceStatus;
  kind?: "quote" | "invoice";
}) {
  const meta = kind === "invoice" ? invoiceMap[status as InvoiceStatus] : quoteMap[status as QuoteStatus];
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", meta.className)}>
      {meta.label}
    </span>
  );
}
