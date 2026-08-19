"use client";

import { Button } from "@/components/Button";
import { Wordmark } from "@/components/Logo";
import { TRADE_LABELS } from "@/lib/ai";
import { PLANS } from "@/lib/plans";
import { useStore } from "@/lib/store";
import { Camera, Check, FileText, Mic, Receipt, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const steps = [
  { icon: Camera, title: "Take photos", copy: "Snap the job from the driveway. Photos sit on the quote." },
  { icon: Mic, title: "Say the work", copy: "“Replace 6 metres of fencing.” Type it if you’d rather." },
  { icon: FileText, title: "AI writes the quote", copy: "A job description plus labour and materials, GST included." },
  { icon: Smartphone, title: "Send it", copy: "SMS, email or WhatsApp. You’re CC’d automatically." },
  { icon: Check, title: "Customer accepts", copy: "They tap a link. No printing, no chasing paper." },
  { icon: Receipt, title: "Invoice & get paid", copy: "One tap converts the quote. Track unpaid. Remind. Export GST." },
];

export default function LandingPage() {
  const router = useRouter();
  const loadDemo = useStore((s) => s.loadDemo);

  return (
    <div className="grain min-h-dvh text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Wordmark />
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/register">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-6 lg:grid-cols-2 lg:pt-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rust">
            New Zealand · Australia
          </p>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl">
            Photo it.
            <br />
            Quote it.
            <br />
            Get paid.
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink-soft">
            QuoteSnap is the simple job book for tradies. Photos and a voice note become a GST-ready quote. When the customer says yes, it becomes an invoice — without Word, spreadsheets, or a full accounting suite.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                loadDemo();
                router.push("/app");
              }}
            >
              Try the live demo
            </Button>
            <Link href="/register">
              <Button variant="secondary">Register your trade</Button>
            </Link>
          </div>
          <p className="mt-3 text-sm text-steel">
            Demo: Hale & Co. Fencing, Auckland · GST 15% · Business plan unlocked
          </p>
        </div>
        <PhonePreview />
      </section>

      <section className="border-y border-line bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3">
          <Stat k="GST done right" v="15% NZ · 10% AU" />
          <Stat k="Built for the tools" v="Plumbers to painters" />
          <Stat k="Not another Xero" v="Quote → invoice → records" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Six taps from the driveway.</h2>
        <p className="mt-2 max-w-xl text-ink-soft">
          Small businesses are moving off paper and Word invoices. QuoteSnap is the front door: capture the job, send the number, collect GST, hand the CSV to your accountant.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="rounded-3xl border border-line bg-card p-5">
              <step.icon className="h-6 w-6 text-rust" />
              <h3 className="mt-3 font-display text-xl">{step.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="font-display text-3xl tracking-tight">For the trades that run on quotes.</h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {Object.values(TRADE_LABELS).map((label) => (
            <span key={label} className="rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold">
              {label}s
            </span>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-t border-line bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Simple pricing. No toolkit bloat.</h2>
          <p className="mt-2 max-w-xl text-paper/70">
            Start free. Unlock invoices, payment tracking and AI photo notes on Business.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-3xl p-5 ${
                  plan.id === "business" ? "bg-rust text-white" : "bg-paper/10"
                }`}
              >
                <p className="text-sm font-semibold uppercase tracking-wider opacity-80">{plan.name}</p>
                <p className="mt-2 font-display text-3xl">
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                  {plan.price > 0 ? <span className="text-base font-sans opacity-80"> /mo</span> : null}
                </p>
                <p className="mt-1 text-sm opacity-80">{plan.tagline}</p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" /> {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-steel sm:flex-row sm:justify-between">
        <p>QuoteSnap · quotes for NZ & Australian SMEs</p>
        <p>Not an accounting system. The easy front-end that gets you paid.</p>
      </footer>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="font-display text-2xl tracking-tight">{k}</p>
      <p className="text-sm text-steel">{v}</p>
    </div>
  );
}

function PhonePreview() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-[2.4rem] border-[10px] border-ink bg-ink shadow-2xl">
        <div className="rounded-[1.8rem] bg-paper p-4">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">
            New quote · QS-0001
          </p>
          <div className="mt-3 overflow-hidden rounded-2xl bg-[#c8b48a]">
            <div className="h-28 bg-gradient-to-b from-[#8a6a3d] to-[#c8b48a] p-3 text-xs text-[#3a2a16]">
              Site photo
              <p className="mt-8 font-display text-lg">6 m paling fence</p>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold">“Replace 6 metres of fencing”</p>
          <p className="text-xs text-steel">Priya Sharma · Grey Lynn, Auckland</p>
          <div className="mt-3 rounded-xl bg-card p-3 text-xs">
            <div className="flex justify-between">
              <span>Labour 4 h</span>
              <span>$280.00</span>
            </div>
            <div className="flex justify-between">
              <span>Materials + cartage</span>
              <span>$522.00</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold">
              <span>Total inc GST</span>
              <span>$922.30 NZD</span>
            </div>
          </div>
          <div className="mt-3 rounded-full bg-rust py-2.5 text-center text-sm font-semibold text-white">
            Send quote
          </div>
        </div>
      </div>
    </div>
  );
}
