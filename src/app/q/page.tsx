"use client";

import { Button } from "@/components/Button";
import { QuoteDocument } from "@/components/QuoteDocument";
import { useStore } from "@/lib/store";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function PublicQuote() {
  const token = useSearchParams().get("t") ?? "";
  const quote = useStore((s) => s.quotes.find((item) => item.publicToken === token));
  const business = useStore((s) => s.business);
  const customer = useStore((s) => s.customers.find((item) => item.id === quote?.customerId));
  const acceptQuote = useStore((s) => s.acceptQuote);
  const declineQuote = useStore((s) => s.declineQuote);
  const [done, setDone] = useState<"accepted" | "declined" | null>(
    quote?.status === "accepted" || quote?.status === "invoiced"
      ? "accepted"
      : quote?.status === "declined"
        ? "declined"
        : null,
  );

  if (!quote || !customer) {
    return (
      <main className="grid min-h-dvh place-items-center px-4 text-center">
        <p>This quote isn’t on this device. Open the link in the same browser the tradie used, or ask them to resend.</p>
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
        {done === "accepted" ? (
          <p className="rounded-2xl bg-fern/15 p-4 font-semibold text-fern">
            Accepted. {business.name} will send your tax invoice next.
          </p>
        ) : done === "declined" ? (
          <p className="rounded-2xl bg-red-50 p-4 text-red-800">Declined. The tradie has been notified on their job book.</p>
        ) : (
          <>
            <Button
              className="w-full"
              onClick={() => {
                acceptQuote(token);
                setDone("accepted");
              }}
            >
              Accept quote
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                declineQuote(token);
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
