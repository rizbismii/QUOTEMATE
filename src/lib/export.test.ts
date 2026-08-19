import { describe, expect, it } from "vitest";
import { accountantCsv } from "./export";
import type { Business, Customer, Invoice } from "./types";

const business: Business = {
  name: "Hale & Co. Fencing",
  ownerName: "Sam Hale",
  email: "sam@halefencing.co.nz",
  phone: "021 555 0148",
  trade: "landscaper",
  country: "NZ",
  city: "Auckland",
  region: "Auckland",
  address: "12 Richmond Road",
  gstRegistered: true,
  taxNumber: "123-456-789",
  bankName: "Kiwibank",
  bankAccount: "38-9012-0054321-00",
  paymentTermsDays: 7,
  ccEmails: [],
  plan: "business",
};

const customers: Customer[] = [
  {
    id: "cus",
    name: "Priya Sharma",
    email: "p@example.com",
    phone: "021",
    address: "14 Tutanekai Street",
    suburb: "Grey Lynn",
    city: "Auckland",
  },
];

const invoices: Invoice[] = [
  {
    id: "inv",
    number: "INV-0001",
    quoteId: "q",
    publicToken: "t",
    customerId: "cus",
    jobAddress: "14 Tutanekai Street",
    title: "Gate repair",
    description: "",
    lineItems: [{ id: "1", kind: "labour", description: "Labour", quantity: 2, unit: "hour", unitPrice: 70 }],
    photos: [],
    notes: "",
    issuedAt: "2026-08-01",
    dueAt: "2026-08-08",
    status: "paid",
    paidAt: "2026-08-03",
    reminders: [],
  },
];

describe("accountant export", () => {
  it("includes GST columns and invoice totals", () => {
    const csv = accountantCsv(invoices, customers, business);
    expect(csv).toContain("GST (15%)");
    expect(csv).toContain("INV-0001");
    expect(csv).toContain("Priya Sharma");
    expect(csv).toContain("140.00");
    expect(csv).toContain("21.00");
    expect(csv).toContain("161.00");
  });
});
