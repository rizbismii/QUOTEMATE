import { describe, expect, it } from "vitest";
import { emptyBusiness } from "./demo";
import { shareMessage } from "./share";
import type { Customer } from "./types";

const customer: Customer = {
  id: "cus",
  name: "Priya Sharma",
  email: "priya@example.com",
  phone: "021 333 8899",
  address: "14 Tutanekai Street",
  suburb: "Grey Lynn",
  city: "Auckland",
};

describe("share messages", () => {
  it("puts the Pay button link in invoice and reminder texts", () => {
    const invoice = shareMessage({
      kind: "invoice",
      number: "INV-0001",
      title: "Deck stain",
      totalLabel: "$161.00 NZD",
      dueOrValid: "27 Aug 2026",
      business: { ...emptyBusiness(), name: "Hale & Co. Fencing" },
      customer,
      url: "https://example.com/i/?t=invdeck",
      payUrl: "https://example.com/pay/?t=invdeck",
      payMethodsLabel: "Visa, Mastercard or bank transfer",
    });
    expect(invoice).toContain("Pay now (Visa, Mastercard or bank transfer): https://example.com/pay/?t=invdeck");
    expect(invoice).toContain("INV-0001");

    const reminder = shareMessage({
      kind: "reminder",
      number: "INV-0001",
      title: "Deck stain",
      totalLabel: "$161.00 NZD",
      dueOrValid: "20 Aug 2026",
      business: { ...emptyBusiness(), name: "Hale & Co. Fencing" },
      customer,
      url: "https://example.com/i/?t=invdeck",
      payUrl: "https://example.com/pay/?t=invdeck",
    });
    expect(reminder).toContain("Pay now");
    expect(reminder).toContain("https://example.com/pay/?t=invdeck");
  });
});
