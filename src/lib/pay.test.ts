import { describe, expect, it } from "vitest";
import { emptyBusiness } from "./demo";
import { cardCheckoutUrl, decoratePayButtonUrl, payMethodLabel } from "./pay";
import type { Invoice } from "./types";

const invoice: Invoice = {
  id: "inv",
  number: "INV-0001",
  quoteId: "q",
  publicToken: "invdeck",
  customerId: "cus",
  jobAddress: "88 Jervois Road",
  title: "Deck stain",
  description: "",
  lineItems: [{ id: "1", kind: "labour", description: "Labour", quantity: 2, unit: "hour", unitPrice: 70 }],
  photos: [],
  notes: "",
  issuedAt: "2026-08-01",
  dueAt: "2026-08-08",
  status: "unpaid",
  reminders: [],
};

describe("pay helpers", () => {
  it("lists Visa, Mastercard and bank transfer", () => {
    expect(payMethodLabel(emptyBusiness())).toBe("Visa, Mastercard or bank transfer");
    expect(payMethodLabel({ ...emptyBusiness(), acceptMastercard: false })).toBe("Visa or bank transfer");
  });

  it("decorates a Pay button link with amount, currency and reference", () => {
    const href = decoratePayButtonUrl("checkout.stripe.com/pay/cs_test", invoice, 161, "NZD");
    expect(href).toContain("https://checkout.stripe.com/pay/cs_test");
    expect(href).toContain("amount=161.00");
    expect(href).toContain("currency=NZD");
    expect(href).toContain("reference=INV-0001");
  });

  it("uses the business Pay button URL for card checkout", () => {
    const business = { ...emptyBusiness(), payButtonUrl: "https://pay.windcave.com/pay/abc" };
    expect(cardCheckoutUrl(business, invoice)).toContain("https://pay.windcave.com/pay/abc");
    expect(cardCheckoutUrl({ ...emptyBusiness(), payButtonUrl: "" }, invoice)).toBe("");
  });
});
