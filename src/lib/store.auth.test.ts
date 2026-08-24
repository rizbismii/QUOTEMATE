import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "./store";

const registerAlex = () =>
  useStore.getState().register({
    ownerName: "Alex Reed",
    email: "alex@reedplumbing.co.nz",
    password: "reedpass",
    businessName: "Reed Plumbing",
    trade: "plumber",
    country: "NZ",
    city: "Auckland",
    phone: "021 444 7788",
    address: "8 Karangahape Road, Auckland 1010",
    registrationNumber: "9429048880001",
    taxNumber: "111-222-333",
    gstRegistered: true,
  });

describe("register, login and password reset", () => {
  beforeEach(() => {
    useStore.setState({
      signedIn: false,
      session: null,
      business: useStore.getState().business,
    });
  });

  it("saves business details and lets you log back in after logout", () => {
    expect(registerAlex().ok).toBe(true);
    const afterRegister = useStore.getState();
    expect(afterRegister.signedIn).toBe(true);
    expect(afterRegister.business.address).toContain("Karangahape");
    expect(afterRegister.business.registrationNumber).toBe("9429048880001");
    expect(afterRegister.business.taxNumber).toBe("111-222-333");

    afterRegister.logout();
    expect(useStore.getState().signedIn).toBe(false);
    expect(useStore.getState().session?.email).toBe("alex@reedplumbing.co.nz");

    expect(useStore.getState().signIn("alex@reedplumbing.co.nz", "wrongpass").ok).toBe(false);
    expect(useStore.getState().signIn("alex@reedplumbing.co.nz", "reedpass")).toEqual({ ok: true });
    expect(useStore.getState().signedIn).toBe(true);
  });

  it("resets the password after confirming the saved mobile", () => {
    registerAlex();
    useStore.getState().logout();

    expect(
      useStore.getState().resetPassword({
        email: "alex@reedplumbing.co.nz",
        mobile: "9999",
        password: "newreed1",
      }).ok,
    ).toBe(false);

    expect(
      useStore.getState().resetPassword({
        email: "alex@reedplumbing.co.nz",
        mobile: "7788",
        password: "newreed1",
      }),
    ).toEqual({ ok: true });

    expect(useStore.getState().signIn("alex@reedplumbing.co.nz", "reedpass").ok).toBe(false);
    expect(useStore.getState().signIn("alex@reedplumbing.co.nz", "newreed1")).toEqual({ ok: true });
  });

  it("saves a new password even when this browser has no job book", async () => {
    useStore.setState({
      signedIn: false,
      session: null,
      business: useStore.getState().business,
    });
    useStore.setState({ business: { ...useStore.getState().business, email: "", phone: "" } });
    const { resetPasswordAnywhere } = await import("./cloud-auth");
    const result = await resetPasswordAnywhere({
      email: "muhammadurizwan@gmail.com",
      mobile: "0273608080",
      password: "newpass1",
    });
    expect(result).toEqual({ ok: true });
    expect(useStore.getState().signIn("muhammadurizwan@gmail.com", "newpass1")).toEqual({ ok: true });
  });
});
