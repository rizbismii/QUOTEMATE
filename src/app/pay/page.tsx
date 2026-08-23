"use client";

import { BusinessBrand } from "@/components/BusinessBrand";
import { Button } from "@/components/Button";
import { PayOptions } from "@/components/PayButton";
import { formatMoney } from "@/lib/money";
import { publicInvoicePath } from "@/lib/paths";
import { invoiceTotal, payMethodLabel } from "@/lib/pay";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function PayCheckout() {
  const token = useSearchParams().get("t") ?? "";
  const invoice = useStore((s) => (s.invoices ?? []).find((item) => item.publicToken === token));
  const business = useStore((s) => s.business);
  const customer = useStore((s) => (s.customers ?? []).find((item) => item.id === invoice?.customerId));
  const markInvoicePaid = useStore((s) => s.markInvoicePaid);
  const [notice, setNotice] = useState("");

  if (!invoice || !customer) {
    return (
      <main className="grid min-h-dvh place-items-center px-4 text-center">
        <p>This pay link isn’t on this device. Open it in the same browser the tradie used, or ask them to resend.</p>
      </main>
    );
  }

  const due = formatMoney(invoiceTotal(invoice, business), business.country, true);

  function openCard(href: string) {
    window.open(href, "_blank", "noopener,noreferrer");
    setNotice("Card checkout opened. Mark the invoice paid once the payment lands.");
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6">
        <BusinessBrand business={business} fallback="name" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">Pay {invoice.number}</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight">{due}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {invoice.title} · {customer.name}
      </p>
      {invoice.status === "paid" ? (
        <p className="mt-6 rounded-2xl bg-fern/15 p-4 font-semibold text-fern">Thanks — this invoice is paid.</p>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-ink-soft">Choose {payMethodLabel(business)}.</p>
          <PayOptions
            business={business}
            invoice={invoice}
            onPayCard={openCard}
            onPaidBank={() => {
              markInvoicePaid(invoice.id);
              setNotice("Marked paid. The tradie will see this on their job book.");
            }}
          />
          {!business.payButtonUrl && (business.acceptVisa || business.acceptMastercard) ? (
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => {
                markInvoicePaid(invoice.id);
                setNotice("Demo card payment recorded. Add your Pay button link in Settings to take live Visa and Mastercard.");
              }}
            >
              Complete demo card payment
            </Button>
          ) : null}
          {notice ? <p className="text-sm text-ink-soft">{notice}</p> : null}
        </div>
      )}
      <Link href={publicInvoicePath(invoice.publicToken)} className="mt-8 block text-center text-sm font-semibold text-rust">
        View full invoice
      </Link>
    </main>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<p className="grid min-h-dvh place-items-center">Opening Pay button…</p>}>
      <PayCheckout />
    </Suspense>
  );
}
