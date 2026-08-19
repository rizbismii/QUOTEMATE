import { describe, expect, it } from "vitest";
import { canCreateQuote, remainingQuotes } from "./plans";
import type { Quote } from "./types";

function quote(createdAt: string): Quote {
  return {
    id: createdAt,
    number: "QS-0001",
    publicToken: "x",
    customerId: "c",
    jobAddress: "",
    city: "",
    photos: [],
    voiceNote: "",
    title: "",
    description: "",
    photoNotes: "",
    lineItems: [],
    notes: "",
    validUntil: "2026-12-31",
    status: "draft",
    sentVia: [],
    createdAt,
    updatedAt: createdAt,
  };
}

describe("plans", () => {
  const now = new Date("2026-08-19T12:00:00");
  const thisMonth = Array.from({ length: 10 }, (_, i) => quote(new Date(2026, 7, i + 1).toISOString()));

  it("caps the free plan at 10 quotes per calendar month", () => {
    expect(canCreateQuote("free", thisMonth, now)).toBe(false);
    expect(remainingQuotes("starter", thisMonth, now)).toBe(20);
    expect(canCreateQuote("pro", thisMonth, now)).toBe(true);
  });

  it("does not count quotes from other months", () => {
    const mixed = [quote("2026-07-01T00:00:00.000Z"), ...thisMonth.slice(0, 3)];
    expect(remainingQuotes("free", mixed, now)).toBe(7);
  });
});
