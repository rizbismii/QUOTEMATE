"use client";

import { InvoiceDocument } from "@/components/InvoiceDocument";
import { PayNowLink } from "@/components/PayButton";
import { publicPayPath } from "@/lib/paths";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PublicInvoice() {
  const token = useSearchParams().get("t") ?? "";
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
            <PayNowLink business={business} invoice={invoice} />
            <Link href={publicPayPath(invoice.publicToken)} className="block text-sm font-semibold text-rust">
              Open Pay button — Visa, Mastercard or bank transfer
            </Link>
            <button
              type="button"
              className="text-xs font-semibold text-steel"
              onClick={() => markInvoicePaid(invoice.id)}
            >
              Mark paid on this device
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function PublicInvoicePage() {
  return (
    <Suspense fallback={<p className="grid min-h-dvh place-items-center">Loading invoice…</p>}>
      <PublicInvoice />
    </Suspense>
  );
}
