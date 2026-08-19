"use client";

import { Button } from "@/components/Button";
import { Field, Input, Select } from "@/components/Field";
import { LineItemsEditor } from "@/components/LineItemsEditor";
import { MoneySummary } from "@/components/MoneySummary";
import { PhotoGrid } from "@/components/PhotoGrid";
import { QuoteDocument } from "@/components/QuoteDocument";
import { VoiceInput } from "@/components/VoiceInput";
import { formatQuoteAllowance, remainingQuotes } from "@/lib/plans";
import { useStore } from "@/lib/store";
import type { Customer, Photo } from "@/lib/types";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const STEPS = ["Photos", "Job", "AI", "Money", "Preview"];

export default function NewQuotePage() {
  const router = useRouter();
  const business = useStore((s) => s.business);
  const quotes = useStore((s) => s.quotes);
  const customers = useStore((s) => s.customers);
  const createQuote = useStore((s) => s.createQuote);
  const updateQuote = useStore((s) => s.updateQuote);
  const generateQuoteAi = useStore((s) => s.generateQuoteAi);

  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [voiceNote, setVoiceNote] = useState("");
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [name, setName] = useState(customers[0]?.name ?? "");
  const [email, setEmail] = useState(customers[0]?.email ?? "");
  const [phone, setPhone] = useState(customers[0]?.phone ?? "");
  const [address, setAddress] = useState(customers[0]?.address ?? "");
  const [city, setCity] = useState(customers[0]?.city || business.city);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const quote = useStore((s) => s.quotes.find((item) => item.id === quoteId));
  const left = remainingQuotes(business.plan, quotes);

  const customerDraft: Omit<Customer, "id"> & { id?: string } = useMemo(
    () => ({
      id: customerId || undefined,
      name,
      email,
      phone,
      address,
      suburb: "",
      city,
    }),
    [address, city, customerId, email, name, phone],
  );

  function pickCustomer(id: string) {
    setCustomerId(id);
    const found = customers.find((item) => item.id === id);
    if (!found) return;
    setName(found.name);
    setEmail(found.email);
    setPhone(found.phone);
    setAddress(found.address);
    setCity(found.city);
  }

  async function ensureQuote() {
    if (quote) return quote;
    const result = createQuote({
      customer: customerDraft,
      jobAddress: address,
      city,
      photos,
      voiceNote,
    });
    if (!result.ok) {
      setError("Monthly quote limit reached. Upgrade your plan to keep quoting.");
      return null;
    }
    setQuoteId(result.quote.id);
    return result.quote;
  }

  async function next() {
    setError("");
    if (quote && (step === 0 || step === 1)) {
      updateQuote(quote.id, { photos, voiceNote, jobAddress: address, city });
    }
    if (step === 1 && (!name || !voiceNote)) {
      setError("Add a customer name and say or type the job.");
      return;
    }
    if (step === 1) {
      const created = await ensureQuote();
      if (!created) return;
    }
    setStep((value) => Math.min(STEPS.length - 1, value + 1));
  }

  return (
    <div>
      <button type="button" onClick={() => router.back()} className="mb-3 flex items-center gap-1 text-sm text-steel">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rust">
        {STEPS[step]} · {formatQuoteAllowance(business.plan, quotes)}
      </p>
      <h1 className="font-display text-3xl tracking-tight">Snap a quote</h1>
      <div className="mt-3 mb-6 flex gap-1">
        {STEPS.map((label, index) => (
          <div
            key={label}
            className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-rust" : "bg-line"}`}
          />
        ))}
      </div>

      {step === 0 ? (
        <section className="space-y-4">
          <p className="text-ink-soft">Take photos of the job. The camera opens on your phone.</p>
          <PhotoGrid photos={photos} editable onChange={setPhotos} />
        </section>
      ) : null}

      {step === 1 ? (
        <section className="space-y-4">
          {customers.length ? (
            <Field label="Existing customer">
              <Select value={customerId} onChange={(e) => pickCustomer(e.target.value)}>
                <option value="">New customer</option>
                {customers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          <Field label="Customer name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Mobile">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
          <Field label="Job address">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="What’s the job?">
            <VoiceInput value={voiceNote} onChange={setVoiceNote} country={business.country} />
          </Field>
        </section>
      ) : null}

      {step === 2 && quote ? (
        <section className="space-y-4">
          <div className="rounded-2xl border border-line bg-card p-4">
            <div className="flex items-center gap-2 text-rust">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-semibold">AI job description</p>
            </div>
            <Input
              className="mt-3"
              value={quote.title}
              onChange={(e) => updateQuote(quote.id, { title: e.target.value })}
            />
            <textarea
              className="mt-2 min-h-40 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm"
              value={quote.description}
              onChange={(e) => updateQuote(quote.id, { description: e.target.value })}
            />
            {quote.photoNotes ? (
              <p className="mt-3 rounded-xl bg-paper p-3 text-xs text-ink-soft">{quote.photoNotes}</p>
            ) : (
              <p className="mt-3 text-xs text-steel">
                Photo notes are included on the Business plan. Description still edits freely.
              </p>
            )}
          </div>
          <Button type="button" variant="secondary" onClick={() => generateQuoteAi(quote.id)}>
            <Sparkles className="h-4 w-4" /> Regenerate from voice note
          </Button>
        </section>
      ) : null}

      {step === 3 && quote ? (
        <section className="space-y-4">
          <p className="text-sm text-ink-soft">Prices are GST exclusive. Totals add {business.country === "NZ" ? "15%" : "10%"} GST if you are registered.</p>
          <LineItemsEditor
            items={quote.lineItems}
            country={business.country}
            onChange={(lineItems) => updateQuote(quote.id, { lineItems })}
          />
          <MoneySummary items={quote.lineItems} business={business} />
        </section>
      ) : null}

      {step === 4 && quote ? (
        <section className="space-y-4">
          <QuoteDocument
            quote={quote}
            business={business}
            customer={{
              id: quote.customerId,
              name,
              email,
              phone,
              address,
              suburb: "",
              city,
            }}
          />
          <Button className="w-full" onClick={() => router.push(`/app/quotes/${quote.id}`)}>
            Open quote to send
          </Button>
        </section>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 flex gap-2">
        {step > 0 ? (
          <Button type="button" variant="secondary" onClick={() => setStep((value) => value - 1)}>
            Back
          </Button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <Button type="button" className="flex-1" onClick={next} disabled={step === 0 && left <= 0}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
