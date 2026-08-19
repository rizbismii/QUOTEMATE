"use client";

import { planById } from "@/lib/plans";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { Button } from "./Button";

export function PlanGate({
  feature,
  children,
}: {
  feature: "invoices" | "payments" | "enhancedAi";
  children: React.ReactNode;
}) {
  const plan = planById(useStore((s) => s.business.plan));
  const allowed = plan[feature];
  if (allowed) return children;
  return (
    <div className="rounded-2xl border border-dashed border-rust/40 bg-rust/5 p-5 text-center">
      <p className="font-display text-xl">Business plan feature</p>
      <p className="mt-1 text-sm text-ink-soft">
        Invoices, GST records, payment tracking and AI photo notes live on the $29.99 plan — the easy front-end before Xero.
      </p>
      <Link href="/app/plan" className="mt-4 inline-block">
        <Button>Upgrade to Business</Button>
      </Link>
    </div>
  );
}
