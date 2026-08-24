import { describe, expect, it } from "vitest";
import {
  emailsMatch,
  hashPassword,
  mobileMatches,
  passwordIsValid,
  publicSession,
  verifyPassword,
} from "./auth";
import { snapshotFromState, workspaceIdForEmail } from "./supabase-sync";
import { emptyBusiness } from "./demo";

describe("auth", () => {
  it("hashes and verifies a saved password", () => {
    const hash = hashPassword("secret1");
    expect(hash.startsWith("fnv1a:")).toBe(true);
    expect(verifyPassword("secret1", hash)).toBe(true);
    expect(verifyPassword("secret2", hash)).toBe(false);
    expect(verifyPassword("secret1", "")).toBe(false);
  });

  it("requires at least 6 characters", () => {
    expect(passwordIsValid("12345")).toBe(false);
    expect(passwordIsValid("123456")).toBe(true);
  });

  it("matches emails case-insensitively", () => {
    expect(emailsMatch("Sam@Hale.co.nz", "sam@hale.co.nz")).toBe(true);
    expect(emailsMatch("a@b.com", "c@d.com")).toBe(false);
  });

  it("matches a stored mobile by full number or last 4 digits", () => {
    expect(mobileMatches("021 555 0148", "0215550148")).toBe(true);
    expect(mobileMatches("021 555 0148", "0148")).toBe(true);
    expect(mobileMatches("021 555 0148", "9999")).toBe(false);
    expect(mobileMatches("", "0148")).toBe(false);
  });

  it("keeps the password hash on a cloud snapshot so reset can work", () => {
    const snapshot = snapshotFromState({
      hydrated: true,
      signedIn: true,
      session: { email: "sam@halefencing.co.nz", name: "Sam", passwordHash: "fnv1a:deadbeef" },
      business: emptyBusiness(),
      customers: [],
      quotes: [],
      invoices: [],
      activities: [],
      quoteSeq: 0,
      invoiceSeq: 0,
    });
    expect(snapshot.session).toEqual({
      email: "sam@halefencing.co.nz",
      name: "Sam",
      passwordHash: "fnv1a:deadbeef",
    });
    expect(publicSession({ email: "a@b.com", name: "A", passwordHash: "x" })).toEqual({
      email: "a@b.com",
      name: "A",
    });
  });

  it("uses a per-email cloud workspace id", () => {
    expect(workspaceIdForEmail("sam@halefencing.co.nz")).toBe("quotesnap-demo");
    expect(workspaceIdForEmail("Muhammadurizwan@gmail.com")).toBe("qs-muhammadurizwan-gmail-com");
  });
});
