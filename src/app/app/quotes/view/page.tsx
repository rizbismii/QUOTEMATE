"use client";

import { Button } from "@/components/Button";
import { LineItemsEditor } from "@/components/LineItemsEditor";
import { MoneySummary } from "@/components/MoneySummary";
import { PhotoGrid } from "@/components/PhotoGrid";
import { PlanGate } from "@/components/PlanGate";
import { QuoteDocument } from "@/components/QuoteDocument";
import { SendSheet } from "@/components/SendSheet";
import { StatusBadge } from "@/components/StatusBadge";
import { Field, Input, Textarea } from "@/components/Field";
import { invoiceViewPath, publicQuotePath, withBase } from "@/lib/paths";
import { publicUrl } from "@/lib/share";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function QuoteDetail() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const quote = useStore((s) => s.quotes.find((item) => item.id === id));
  const business = useStore((s) => s.business);
  const customer = useStore((s) => s.customers.find((item) => item.id === quote?.customerId));
  const updateQuote = useStore((s) => s.updateQuote);
  const convertToInvoice = useStore((s) => s.convertToInvoice);
  const [editing, setEditing] = useState(false);

  if (!quote || !customer) {
    return <p className="text-steel">Quote not found.</p>;
  }

  function convert() {
    if (!quote) return;
    const result = convertToInvoice(quote.id);
    if (result.ok) router.push(invoiceViewPath(result.invoice.id));
  }

  const customerPath = publicQuotePath(quote.publicToken);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-steel">{quote.number}</p>
          <h1 className="font-display text-3xl tracking-tight">{quote.title}</h1>
        </div>
        <StatusBadge status={quote.status} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setEditing((value) => !value)}>
          {editing ? "Done" : "Edit"}
        </Button>
        {quote.status === "accepted" || quote.status === "invoiced" ? (
          <PlanGate feature="invoices">
            <Button onClick={convert} disabled={quote.status === "invoiced"}>
              Convert to invoice
            </Button>
          </PlanGate>
        ) : (
          <Button variant="secondary" onClick={() => window.open(withBase(customerPath), "_blank")}>
            Preview as customer
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <Field label="Title">
            <Input value={quote.title} onChange={(e) => updateQuote(quote.id, { title: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea
              value={quote.description}
              onChange={(e) => updateQuote(quote.id, { description: e.target.value })}
            />
          </Field>
          <PhotoGrid
            photos={quote.photos}
            editable
            onChange={(photos) => updateQuote(quote.id, { photos })}
          />
          <LineItemsEditor
            items={quote.lineItems}
            country={business.country}
            onChange={(lineItems) => updateQuote(quote.id, { lineItems })}
          />
          <Field label="Internal notes">
            <Input value={quote.notes} onChange={(e) => updateQuote(quote.id, { notes: e.target.value })} />
          </Field>
        </div>
      ) : (
        <QuoteDocument quote={quote} business={business} customer={customer} />
      )}

      <MoneySummary items={quote.lineItems} business={business} />
      <SendSheet kind="quote" quote={quote} />
      <p className="text-xs text-steel">
        Customer link:{" "}
        <Link className="font-semibold text-rust" href={customerPath}>
          {publicUrl(customerPath)}
        </Link>
      </p>
    </div>
  );
}

export default function QuoteDetailPage() {
  return (
    <Suspense fallback={<p className="text-steel">Opening quote…</p>}>
      <QuoteDetail />
    </Suspense>
  );
}
