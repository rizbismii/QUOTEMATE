import { describe, expect, it } from "vitest";
import { financialYear, formatMoney, gstRate, roundMoney, totals } from "./money";
import type { LineItem } from "./types";

const items = (rows: Array<Pick<LineItem, "quantity" | "unitPrice">>) => rows;

describe("GST", () => {
  it("uses 15% for registered NZ businesses", () => {
    expect(gstRate("NZ", true)).toBe(0.15);
    const money = totals(items([{ quantity: 4, unitPrice: 70 }]), "NZ", true);
    expect(money.subtotal).toBe(280);
    expect(money.gst).toBe(42);
    expect(money.total).toBe(322);
  });

  it("uses 10% for registered AU businesses", () => {
    expect(gstRate("AU", true)).toBe(0.1);
    const money = totals(items([{ quantity: 1, unitPrice: 100 }]), "AU", true);
    expect(money.gst).toBe(10);
    expect(money.total).toBe(110);
  });

  it("tolerates missing line items and country", () => {
    expect(totals(undefined, undefined as unknown as "NZ", true).total).toBe(0);
    expect(formatMoney(10, undefined as unknown as "NZ", true)).toBe("$10.00 NZD");
  });

  it("charges no GST when not registered", () => {
    const money = totals(items([{ quantity: 2, unitPrice: 50 }]), "NZ", false);
    expect(money.gst).toBe(0);
    expect(money.total).toBe(100);
  });

  it("rounds to the nearest cent", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    const money = totals(
      items([
        { quantity: 6, unitPrice: 48 },
        { quantity: 4, unitPrice: 70 },
        { quantity: 3, unitPrice: 38 },
        { quantity: 1, unitPrice: 120 },
      ]),
      "NZ",
      true,
    );
    expect(money.subtotal).toBe(802);
    expect(money.gst).toBe(120.3);
    expect(money.total).toBe(922.3);
  });

  it("uses April–March FY for NZ and July–June for AU", () => {
    const nz = financialYear("NZ", new Date("2026-08-19T12:00:00"));
    expect(nz.label).toBe("2026/27");
    expect(nz.start.getMonth()).toBe(3);
    const au = financialYear("AU", new Date("2026-08-19T12:00:00"));
    expect(au.label).toBe("2026/27");
    expect(au.start.getMonth()).toBe(6);
    const auEarly = financialYear("AU", new Date("2026-05-01T12:00:00"));
    expect(auEarly.label).toBe("2025/26");
  });
});
