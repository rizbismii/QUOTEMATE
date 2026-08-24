"use client";

import { Button } from "@/components/Button";
import { QuoteDocument } from "@/components/QuoteDocument";
import { normalizeBusiness } from "@/lib/demo";
import { findPublicQuote, patchPublicQuote } from "@/lib/supabase-sync";
import { useStore } from "@/lib/store";
import type { Business, Customer, Quote } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function PublicQuote() {
  const search = useSearchParams();
  const token = search.get("t") ?? "";
  const action = search.get("a");
  const storeQuote = useStore((s) => s.quotes.find((item) => item.publicToken === token));
  const storeBusiness = useStore((s) => s.business);
  const storeCustomer = useStore((s) => s.customers.find((item) => item.id === storeQuote?.customerId));
  const acceptQuote = useStore((s) => s.acceptQuote);
  const declineQuote = useStore((s) => s.declineQuote);
  const [cloud, setCloud] = useState<{ quote: Quote; business: Business; customer?: Customer } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(storeQuote ? "ready" : "loading");
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);
  const actedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("missing");
      return;
    }
    if (storeQuote && storeCustomer) {
      setStatus("ready");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    void findPublicQuote(token)
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
  }, [token, storeQuote, storeCustomer]);

  const quote = storeQuote ?? cloud?.quote;
  const business = normalizeBusiness(storeQuote ? storeBusiness : cloud?.business);
  const customer = storeQuote ? storeCustomer : cloud?.customer;
  const outcome =
    done ??
    (quote?.status === "accepted" || quote?.status === "invoiced"
      ? "accepted"
      : quote?.status === "declined"
        ? "declined"
        : null);

  useEffect(() => {
    if (status !== "ready" || !quote || !customer || actedRef.current) return;
    if (action !== "accept" && action !== "decline") return;
    actedRef.current = true;
    if (action === "accept") {
      acceptQuote(token);
      void patchPublicQuote(token, { status: "accepted", acceptedAt: new Date().toISOString() });
      setDone("accepted");
      return;
    }
    declineQuote(token);
    void patchPublicQuote(token, { status: "declined", declinedAt: new Date().toISOString() });
    setDone("declined");
  }, [status, quote, customer, action, token, acceptQuote, declineQuote]);

  if (status === "loading") {
    return (
      <main className="grid min-h-dvh place-items-center px-4 text-center">
        <p className="text-sm text-steel">Opening quote…</p>
      </main>
    );
  }

  if (!quote || !customer) {
    return (
      <main className="grid min-h-dvh place-items-center px-4 text-center">
        <p>This quote isn’t available. Ask the tradie to send it again.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-steel">
        Quote from {business.name}
      </p>
      <QuoteDocument quote={quote} business={business} customer={customer} />
      <div className="no-print mx-auto mt-6 max-w-md space-y-3 text-center">
        {outcome === "accepted" ? (
          <p className="rounded-2xl bg-fern/15 p-4 font-semibold text-fern">
            Accepted. {business.name} will send your tax invoice next.
          </p>
        ) : outcome === "declined" ? (
          <p className="rounded-2xl bg-red-50 p-4 text-red-800">Declined. The tradie has been notified on their job book.</p>
        ) : (
          <>
            <Button
              className="w-full"
              onClick={() => {
                acceptQuote(token);
                void patchPublicQuote(token, { status: "accepted", acceptedAt: new Date().toISOString() });
                setDone("accepted");
              }}
            >
              Accept
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                declineQuote(token);
                void patchPublicQuote(token, { status: "declined", declinedAt: new Date().toISOString() });
                setDone("declined");
              }}
            >
              Decline
            </Button>
            <p className="text-xs text-steel">
              Questions? Call {business.ownerName} on {business.phone}
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default function PublicQuotePage() {
  return (
    <Suspense fallback={<p className="grid min-h-dvh place-items-center">Loading quote…</p>}>
      <PublicQuote />
    </Suspense>
  );
}
