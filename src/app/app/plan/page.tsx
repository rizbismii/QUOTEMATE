"use client";

import { Button } from "@/components/Button";
import { PLANS } from "@/lib/plans";
import { useStore } from "@/lib/store";
import { Check } from "lucide-react";

export default function PlanPage() {
  const current = useStore((s) => s.business.plan);
  const setPlan = useStore((s) => s.setPlan);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl tracking-tight">Plans</h1>
      <p className="text-sm text-ink-soft">
        This demo switches plans on this device. No card is charged.
      </p>
      {PLANS.map((plan) => (
        <div
          key={plan.id}
          className={`rounded-3xl border p-5 ${
            current === plan.id ? "border-rust bg-rust/5" : "border-line bg-card"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-2xl">{plan.name}</p>
              <p className="text-sm text-steel">{plan.tagline}</p>
            </div>
            <p className="font-display text-2xl">{plan.price === 0 ? "Free" : `$${plan.price}`}</p>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-2">
                <Check className="h-4 w-4 text-fern" /> {feature}
              </li>
            ))}
          </ul>
          <Button
            className="mt-4"
            variant={current === plan.id ? "secondary" : "primary"}
            disabled={current === plan.id}
            onClick={() => setPlan(plan.id)}
          >
            {current === plan.id ? "Current plan" : "Switch to this plan"}
          </Button>
        </div>
      ))}
    </div>
  );
}
