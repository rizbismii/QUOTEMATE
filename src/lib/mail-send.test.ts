import { describe, expect, it } from "vitest";
import { mailHint, sentMailItem } from "./mail-send";

describe("in-app mail", () => {
  it("records a sent HTML copy for the contractor to read later", () => {
    const mail = sentMailItem({
      from: "Muhammadurizwan@gmail.com",
      to: "rizbismii@gmail.com",
      subject: "Quote QS-0002 from Faz and co",
      text: "View quote",
      html: "<a href='https://example.com/q/?t=abc&a=accept'>Accept</a>",
      quoteId: "q2",
    });
    expect(mail.folder).toBe("sent");
    expect(mail.status).toBe("sent");
    expect(mail.html).toContain("Accept");
    expect(mail.to).toBe("rizbismii@gmail.com");
  });

  it("explains when the quote actually left from the app", () => {
    expect(mailHint("gmail")).toContain("Sent");
    expect(mailHint("cloud")).toContain("formatted quote");
    expect(mailHint("mailto")).toContain("paste");
  });
});
