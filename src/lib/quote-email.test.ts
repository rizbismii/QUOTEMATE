import { describe, expect, it } from "vitest";
import { emptyBusiness } from "./demo";
import { quoteActionUrl, quoteEmailEml, quoteEmailHtml } from "./quote-email";
import type { Customer, Quote } from "./types";

const business = {
  ...emptyBusiness(),
  name: "Faz and co",
  ownerName: "MOHAMMED",
  email: "Muhammadurizwan@gmail.com",
  phone: "0273608089",
  city: "Wellington",
  address: "119 Manners st",
  registrationNumber: "435654231",
  taxNumber: "Gst2201",
  gstRegistered: true,
};

const customer: Customer = {
  id: "cus",
  name: "Jerry",
  email: "rizbismii@gmail.com",
  phone: "0273608089",
  address: "76 Manners st",
  suburb: "",
  city: "Wellington",
};

const quote: Quote = {
  id: "quo1",
  number: "QS-0001",
  publicToken: "49qo53zi",
  customerId: "cus",
  jobAddress: "76 Manners st",
  city: "Wellington",
  photos: [],
  voiceNote: "",
  title: "Replace the electrical cables and the plugpoints needs fixed",
  description: "Carry out the following work at 76 Manners st, Wellington: replace the electrical cables and the plugpoints needs fixed",
  photoNotes: "",
  lineItems: [
    {
      id: "li1",
      kind: "labour",
      description: "Plumber labour",
      quantity: 2.5,
      unit: "hour",
      unitPrice: 95,
    },
    {
      id: "li2",
      kind: "materials",
      description: "Materials and consumables (estimated)",
      quantity: 1,
      unit: "lot",
      unitPrice: 150,
    },
  ],
  notes: "",
  validUntil: "2026-09-23",
  status: "sent",
  sentVia: ["email"],
  createdAt: "2026-08-24T00:00:00.000Z",
  updatedAt: "2026-08-24T00:00:00.000Z",
};

describe("quote HTML email", () => {
  it("builds Accept and Decline button links", () => {
    expect(quoteActionUrl("https://example.com/q/?t=49qo53zi", "accept")).toBe(
      "https://example.com/q/?t=49qo53zi&a=accept",
    );
    const html = quoteEmailHtml({
      quote,
      business,
      customer,
      viewUrl: "https://rizbismii.github.io/QUOTEMATE/q/?t=49qo53zi",
    });
    expect(html).toContain(">QUOTE<");
    expect(html).toContain("QS-0001");
    expect(html).toContain("Faz and co");
    expect(html).toContain("Bill to");
    expect(html).toContain("Jerry");
    expect(html).toContain("Plumber labour");
    expect(html).toContain("GST (15%)");
    expect(html).toContain("Accept</a>");
    expect(html).toContain("Decline</a>");
    expect(html).toContain("a=accept");
    expect(html).toContain("a=decline");
    expect(html).not.toContain("Accept quote:");
  });

  it("wraps the HTML quote in an unsent eml draft", () => {
    const eml = quoteEmailEml({
      to: "rizbismii@gmail.com",
      cc: "Muhammadurizwan@gmail.com",
      subject: "Quote QS-0001 from Faz and co",
      html: "<p>quote</p>",
    });
    expect(eml).toContain("Content-Type: text/html; charset=UTF-8");
    expect(eml).toContain("X-Unsent: 1");
    expect(eml).toContain("To: rizbismii@gmail.com");
    expect(eml).toContain("<p>quote</p>");
  });
});
