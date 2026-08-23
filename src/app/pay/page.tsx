"use client";

import { BusinessBrand } from "@/components/BusinessBrand";
import { Button } from "@/components/Button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PayOptions } from "@/components/PayButton";
import { normalizeBusiness } from "@/lib/demo";
import { formatMoney } from "@/lib/money";
import { publicInvoicePath, withBase } from "@/lib/paths";
import { invoiceTotal, payMethodLabel } from "@/lib/pay";
import { findPublicInvoice } from "@/lib/supabase-sync";
import { useStore } from "@/lib/store";
import type { Business, Customer, Invoice } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function readToken(search: { get: (key: string) => string | null }): string {
  const fromRouter = search.get("t")?.trim();
  if (fromRouter) return fromRouter;
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("t")?.trim() ?? "";
}

function PayCheckout() {
  const search = useSearchParams();
  const [token, setToken] = useState(() => readToken(search));
  const [cloud, setCloud] = useState<{ invoice: Invoice; business: Business; customer?: Customer } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [notice, setNotice] = useState("");

  const storeInvoice = useStore((s) => (s.invoices ?? []).find((item) => item.publicToken === token));
  const storeBusiness = useStore((s) => s.business);
  const storeCustomer = useStore((s) => (s.customers ?? []).find((item) => item.id === storeInvoice?.customerId));
  const markInvoicePaid = useStore((s) => s.markInvoicePaid);

  useEffect(() => {
    setToken(readToken(search));
  }, [search]);

  useEffect(() => {
    if (!token) {
      setStatus("missing");
      return;
    }
    if (storeInvoice && storeCustomer) {
      setStatus("ready");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    void findPublicInvoice(token)
      .then((found) => {
        if (cancelled) return;
        setCloud(found);
        setStatus(found ? "ready" : "missing");
      })
      .catch(() => {
        if (!cancelled) setStatus("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [token, storeInvoice, storeCustomer]);

  const invoice = storeInvoice ?? cloud?.invoice;
  const business = normalizeBusiness(storeInvoice ? storeBusiness : cloud?.business);
  const customer = storeInvoice ? storeCustomer : cloud?.customer;

  if (status === "loading") {
    return (
      <main className="grid min-h-dvh place-items-center px-4 text-center">
        <p className="text-sm text-steel">Opening Pay button…</p>
      </main>
    );
  }

  if (!invoice || !customer) {
    return (
      <main className="grid min-h-dvh place-items-center px-4 text-center">
        <div>
          <p className="font-display text-2xl">Pay link not found</p>
          <p className="mt-2 text-sm text-ink-soft">
            Ask the tradie to send the Pay button again, or open this link on the device they used.
          </p>
        </div>
      </main>
    );
  }

  const due = formatMoney(invoiceTotal(invoice, business), business.country, true);

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
            onPayCard={(href) => {
              window.open(href, "_blank", "noopener,noreferrer");
              setNotice("Card checkout opened. Mark the invoice paid once the payment lands.");
            }}
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
      <a
        href={withBase(publicInvoicePath(invoice.publicToken))}
        className="mt-8 block text-center text-sm font-semibold text-rust"
      >
        View full invoice
      </a>
    </main>
  );
}

export default function PayPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<p className="grid min-h-dvh place-items-center">Opening Pay button…</p>}>
        <PayCheckout />
      </Suspense>
    </ErrorBoundary>
  );
}
