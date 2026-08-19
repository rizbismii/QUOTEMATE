import type { PlanId, Quote } from "./types";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  tagline: string;
  quotesPerMonth: number;
  invoices: boolean;
  payments: boolean;
  enhancedAi: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    tagline: "Try it on the tools",
    quotesPerMonth: 10,
    invoices: false,
    payments: false,
    enhancedAi: false,
    features: ["10 quotes / month", "Photo + voice quotes", "Send by SMS, email or WhatsApp"],
  },
  {
    id: "starter",
    name: "Starter",
    price: 9.99,
    tagline: "For a busy week",
    quotesPerMonth: 30,
    invoices: false,
    payments: false,
    enhancedAi: false,
    features: ["30 quotes / month", "Customer accept links", "NZ & AU GST on quotes"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 19.99,
    tagline: "Unlimited quoting",
    quotesPerMonth: Infinity,
    invoices: false,
    payments: false,
    enhancedAi: false,
    features: ["Unlimited quotes", "Reusable customers", "Professional quote layout"],
  },
  {
    id: "business",
    name: "Business",
    price: 29.99,
    tagline: "Quote → invoice → paid",
    quotesPerMonth: Infinity,
    invoices: true,
    payments: true,
    enhancedAi: true,
    features: [
      "Unlimited quotes",
      "AI job descriptions from photos + voice",
      "One-tap quote → invoice",
      "GST on invoices",
      "Payment tracking & reminders",
      "Export for your accountant",
    ],
  },
];

export function planById(id: PlanId): Plan {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0];
}

export function quotesInMonth(quotes: Quote[], now = new Date()): number {
  const year = now.getFullYear();
  const month = now.getMonth();
  return quotes.filter((quote) => {
    const created = new Date(quote.createdAt);
    return created.getFullYear() === year && created.getMonth() === month;
  }).length;
}

export function remainingQuotes(planId: PlanId, quotes: Quote[], now = new Date()): number {
  const plan = planById(planId);
  if (!Number.isFinite(plan.quotesPerMonth)) return Number.POSITIVE_INFINITY;
  return Math.max(0, plan.quotesPerMonth - quotesInMonth(quotes, now));
}

export function canCreateQuote(planId: PlanId, quotes: Quote[], now = new Date()): boolean {
  return remainingQuotes(planId, quotes, now) > 0;
}

export function formatQuoteAllowance(planId: PlanId, quotes: Quote[], now = new Date()): string {
  const plan = planById(planId);
  if (!Number.isFinite(plan.quotesPerMonth)) return "Unlimited quotes this month";
  const used = quotesInMonth(quotes, now);
  return `${used} / ${plan.quotesPerMonth} quotes this month`;
}
