import { describe, expect, it } from "vitest";
import { buildQuoteEml, quoteEmailFileName } from "./send-email";

describe("HTML quote email file", () => {
  it("builds a multipart email with HTML Accept buttons", () => {
    const eml = buildQuoteEml({
      from: "Muhammadurizwan@gmail.com",
      to: "rizbismii@gmail.com",
      cc: "Muhammadurizwan@gmail.com",
      subject: "Quote QS-0002 from Faz and co",
      html: '<a href="https://example.com/q/?t=abc&a=accept">Accept</a>',
      text: "View quote:\nhttps://example.com/q/?t=abc",
    });
    expect(eml).toContain("Content-Type: multipart/alternative");
    expect(eml).toContain("Content-Type: text/html");
    expect(eml).toContain("Content-Type: text/plain");
    expect(eml).toContain("To: rizbismii@gmail.com");
    expect(Buffer.from(eml.split("text/html")[1].split("--")[0], "utf8").toString()).toBeTruthy();
    const htmlPart = eml.split('Content-Type: text/html; charset="UTF-8"')[1];
    const base64 = htmlPart
      .split("Content-Transfer-Encoding: base64")[1]
      .split("--")[0]
      .replace(/\s/g, "");
    expect(Buffer.from(base64, "base64").toString("utf8")).toContain("Accept</a>");
    expect(quoteEmailFileName("QS-0002")).toBe("Quote-QS-0002.eml");
  });
});
