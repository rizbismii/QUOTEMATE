"use client";

import { Button } from "@/components/Button";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { useStore } from "@/lib/store";
import { useParams } from "next/navigation";

export default function PublicInvoicePage() {
  const { token } = useParams<{ token: string }>();
  const invoice = useStore((s) => s.invoices.find((item) => item.publicToken === token));
  const business = useStore((s) => s.business);
  const customer = useStore((s) => s.customers.find((item) => item.id === invoice?.customerId));
  const markInvoicePaid = useStore((s) => s.markInvoicePaid);

  if (!invoice || !customer) {
    return (
      <main className="grid min-h-dvh place-items-center px-4 text-center">
        <p>This invoice isn’t on this device. Open it in the same browser the tradie used.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-steel">
        Tax invoice from {business.name}
      </p>
      <InvoiceDocument invoice={invoice} business={business} customer={customer} />
      <div className="no-print mx-auto mt-6 max-w-md space-y-3 text-center">
        {invoice.status === "paid" ? (
          <p className="rounded-2xl bg-fern/15 p-4 font-semibold text-fern">Thanks — this invoice is marked paid.</p>
        ) : (
          <>
            <p className="text-sm text-ink-soft">
              Pay by bank transfer using the details on the invoice, then tap below if you’re testing the demo.
            </p>
            <Button className="w-full" onClick={() => markInvoicePaid(invoice.id)}>
              Simulate payment received
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
