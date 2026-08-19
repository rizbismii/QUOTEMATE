import { describe, expect, it } from "vitest";
import { generateJob } from "./ai";

describe("AI job generator", () => {
  it("turns a fencing voice note into metres, labour and materials", () => {
    const result = generateJob({
      voiceNote: "Replace 6 metres of fencing",
      trade: "landscaper",
      country: "NZ",
      city: "Auckland",
      jobAddress: "14 Tutanekai Street",
      photoCount: 1,
      enhancedAi: true,
    });
    expect(result.title).toMatch(/6 metres of fencing/i);
    expect(result.description).toMatch(/14 Tutanekai Street/);
    expect(result.lineItems.some((item) => item.kind === "labour")).toBe(true);
    expect(result.lineItems.some((item) => item.unit === "m" && item.quantity === 6)).toBe(true);
    expect(result.photoNotes).toMatch(/1 site photo/);
  });

  it("uses Australian labour rates when country is AU", () => {
    const nz = generateJob({
      voiceNote: "Fix leaking tap, 2 hours",
      trade: "plumber",
      country: "NZ",
      city: "Wellington",
      jobAddress: "1 Cuba Street",
      photoCount: 0,
      enhancedAi: false,
    });
    const au = generateJob({
      voiceNote: "Fix leaking tap, 2 hours",
      trade: "plumber",
      country: "AU",
      city: "Melbourne",
      jobAddress: "1 Smith Street",
      photoCount: 0,
      enhancedAi: false,
    });
    const nzLabour = nz.lineItems.find((item) => item.kind === "labour");
    const auLabour = au.lineItems.find((item) => item.kind === "labour");
    expect(nzLabour?.quantity).toBe(2);
    expect(auLabour?.unitPrice).toBeGreaterThan(nzLabour?.unitPrice ?? 0);
  });
});
