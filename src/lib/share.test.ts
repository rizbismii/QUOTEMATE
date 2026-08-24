import { describe, expect, it } from "vitest";
import { emptyBusiness } from "./demo";
import { buildShareUrl, mailtoHref, shareMessage } from "./share";
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

const business = { ...emptyBusiness(), name: "Hale & Co. Fencing", email: "sam@halefencing.co.nz" };

describe("share messages", () => {
  it("puts Accept quote on its own lines", () => {
    const quote = shareMessage({
      kind: "quote",
      number: "QS-0001",
      title: "New paling fence",
      totalLabel: "$391.00 NZD",
      dueOrValid: "23 Sept 2026",
      business,
      customer,
      url: "https://example.com/q/?t=abc",
    });
    expect(quote).toContain("Accept:\nhttps://example.com/q/?t=abc&a=accept");
    expect(quote).toContain("Decline:\nhttps://example.com/q/?t=abc&a=decline");
    expect(quote).toContain("Valid until 23 Sept 2026.");
    expect(quote).not.toContain("Kia ora Priya, Hale");
  });

  it("puts the Pay button link in invoice and reminder texts", () => {
    const invoice = shareMessage({
      kind: "invoice",
      number: "INV-0001",
      title: "Deck stain",
      totalLabel: "$161.00 NZD",
      dueOrValid: "27 Aug 2026",
      business,
      customer,
      url: "https://example.com/i/?t=invdeck",
      payUrl: "https://example.com/pay/?t=invdeck",
      payMethodsLabel: "Visa, Mastercard or bank transfer",
    });
    expect(invoice).toContain("Pay now (Visa, Mastercard or bank transfer):\nhttps://example.com/pay/?t=invdeck");
    expect(invoice).toContain("INV-0001");

    const reminder = shareMessage({
      kind: "reminder",
      number: "INV-0001",
      title: "Deck stain",
      totalLabel: "$161.00 NZD",
      dueOrValid: "20 Aug 2026",
      business,
      customer,
      url: "https://example.com/i/?t=invdeck",
      payUrl: "https://example.com/pay/?t=invdeck",
    });
    expect(reminder).toContain("Pay now");
    expect(reminder).toContain("https://example.com/pay/?t=invdeck");
  });

  it("encodes mailto spaces as %20 so Gmail does not show plus signs", () => {
    const href = buildShareUrl({
      channel: "email",
      country: "NZ",
      customer,
      business,
      subject: "Quote QS-0001 from FAZ AND CO",
      body: shareMessage({
        kind: "quote",
        number: "QS-0001",
        title: "Update the door",
        totalLabel: "$391.00 NZD",
        dueOrValid: "23 Sept 2026",
        business: { ...business, name: "FAZ AND CO" },
        customer: { ...customer, name: "Jerry" },
        url: "https://rizbismii.github.io/QUOTEMATE/q/?t=jywnuhke",
      }),
    });
    expect(href).toContain("mailto:priya%40example.com?");
    expect(href).toContain("subject=Quote%20QS-0001%20from%20FAZ%20AND%20CO");
    expect(href).toContain("Accept%3A");
    expect(href).toContain("a%3Daccept");
    expect(href).not.toMatch(/Quote\+QS-0001/);
    expect(href).not.toMatch(/Kia\+ora/);
    expect(mailtoHref("a@b.com", "Hi there", "Hello world")).toBe(
      "mailto:a%40b.com?subject=Hi%20there&body=Hello%20world",
    );
  });
});
