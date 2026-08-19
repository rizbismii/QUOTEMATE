"use client";

import { Button } from "@/components/Button";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { PlanGate } from "@/components/PlanGate";
import { SendSheet } from "@/components/SendSheet";
import { invoiceIsOverdue } from "@/lib/money";
import { useStore } from "@/lib/store";
import { useParams } from "next/navigation";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const invoice = useStore((s) => s.invoices.find((item) => item.id === id));
  const business = useStore((s) => s.business);
  const customer = useStore((s) => s.customers.find((item) => item.id === invoice?.customerId));
  const markInvoicePaid = useStore((s) => s.markInvoicePaid);

  if (!invoice || !customer) return <p className="text-steel">Invoice not found.</p>;

  const overdue = invoiceIsOverdue(invoice);

  return (
    <PlanGate feature="invoices">
      <div className="space-y-4">
        <h1 className="font-display text-3xl tracking-tight">{invoice.number}</h1>
        <div className="flex flex-wrap gap-2 no-print">
          <PlanGate feature="payments">
            {invoice.status !== "paid" ? (
              <Button onClick={() => markInvoicePaid(invoice.id)}>Mark paid</Button>
            ) : (
              <p className="rounded-full bg-fern/15 px-3 py-2 text-sm font-semibold text-fern">Paid</p>
            )}
          </PlanGate>
          <Button variant="secondary" onClick={() => window.print()}>
            Print / PDF
          </Button>
          <Button variant="secondary" onClick={() => window.open(`/i/${invoice.publicToken}`, "_blank")}>
            Customer view
          </Button>
        </div>
        {overdue && invoice.status !== "paid" ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">This invoice is overdue.</p>
        ) : null}
        <InvoiceDocument invoice={invoice} business={business} customer={customer} />
        {invoice.status !== "paid" ? <SendSheet kind="reminder" invoice={invoice} /> : null}
        <SendSheet kind="invoice" invoice={invoice} />
      </div>
    </PlanGate>
  );
}
