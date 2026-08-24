import { describe, expect, it } from "vitest";
import { emptyBusiness } from "./demo";
import { mergeSnapshots } from "./merge-snapshots";
import type { Snapshot } from "./supabase-sync";
import type { Activity, Customer, Invoice, Quote } from "./types";

const email = "Muhammadurizwan@gmail.com";

function quote(partial: Partial<Quote> & Pick<Quote, "id" | "number" | "status">): Quote {
  return {
    publicToken: partial.publicToken || `tok-${partial.id}`,
    customerId: partial.customerId || "cust_jerry",
    jobAddress: "Wellington",
    city: "Wellington",
    photos: [],
    voiceNote: "",
    title: partial.title || partial.number,
    description: partial.description || "",
    photoNotes: "",
    lineItems: [],
    notes: "",
    validUntil: "2026-09-01",
    sentVia: [],
    createdAt: partial.createdAt || "2026-08-24T02:24:00.000Z",
    updatedAt: partial.updatedAt || partial.createdAt || "2026-08-24T02:24:00.000Z",
    ...partial,
  };
}

function customer(partial: Partial<Customer> & Pick<Customer, "id" | "name">): Customer {
  return {
    email: "",
    phone: "",
    address: "",
    suburb: "",
    city: "",
    ...partial,
  };
}

function invoice(partial: Partial<Invoice> & Pick<Invoice, "id" | "number" | "status">): Invoice {
  return {
    quoteId: partial.quoteId || "q1",
    publicToken: partial.publicToken || `inv-${partial.id}`,
    customerId: "cust_jerry",
    jobAddress: "Wellington",
    title: partial.title || partial.number,
    description: "",
    lineItems: [],
    photos: [],
    notes: "",
    issuedAt: partial.issuedAt || "2026-08-24T04:00:00.000Z",
    dueAt: "2026-08-31",
    reminders: [],
    ...partial,
  };
}

function snap(partial: Partial<Snapshot> = {}): Snapshot {
  return {
    signedIn: true,
    session: {
      email,
      name: "Mohammed",
      passwordHash: "fnv1a:localhash",
    },
    business: {
      ...emptyBusiness(),
      name: "Faz and co.",
      ownerName: "Mohammed",
      email,
      phone: "0273608080",
      city: "Wellington",
      country: "NZ",
      plan: "free",
    },
    customers: [],
    quotes: [],
    invoices: [],
    activities: [],
    quoteSeq: 0,
    invoiceSeq: 0,
    ...partial,
  };
}

describe("mergeSnapshots", () => {
  it("keeps quotes that only exist on one device and prefers the newer status", () => {
    const jerry = customer({ id: "cust_jerry", name: "Jerry" });
    const tom = customer({ id: "cust_tom", name: "Tom holland", email: "tom@example.com" });

    const local = snap({
      quoteSeq: 1,
      customers: [jerry],
      quotes: [
        quote({
          id: "q1",
          number: "QS-0001",
          publicToken: "49qo53zi",
          status: "declined",
          title: "Replace the electrical cables and the plugpoints needs fixed",
          updatedAt: "2026-08-24T03:20:48.730Z",
          declinedAt: "2026-08-24T03:20:48.730Z",
        }),
      ],
      activities: [
        { id: "a1", at: "2026-08-24T03:20:00.000Z", message: "Quote sent via email", quoteId: "q1" },
        { id: "a0", at: "2026-08-24T02:24:00.000Z", message: "Draft quote QS-0001 created", quoteId: "q1" },
      ],
    });

    const remote = snap({
      session: { email, name: "Mohammed", passwordHash: "fnv1a:phonehash" },
      quoteSeq: 2,
      customers: [jerry, tom],
      quotes: [
        quote({
          id: "q1",
          number: "QS-0001",
          publicToken: "49qo53zi",
          status: "sent",
          title: "Replace the electrical cables and the plugpoints needs fixed",
          updatedAt: "2026-08-24T03:18:00.000Z",
          sentAt: "2026-08-24T03:18:00.000Z",
        }),
        quote({
          id: "q2",
          number: "QS-0002",
          publicToken: "tomdoor1",
          customerId: "cust_tom",
          status: "sent",
          title: "Change the door knob and fix the door",
          updatedAt: "2026-08-24T03:18:00.000Z",
          sentAt: "2026-08-24T03:18:00.000Z",
        }),
      ],
      activities: [
        { id: "a-phone", at: "2026-08-24T03:18:00.000Z", message: "Quote sent via email", quoteId: "q2" },
      ],
    });

    const { snapshot, changed } = mergeSnapshots(local, remote);
    expect(changed).toBe(true);
    expect(snapshot.quotes.map((item) => item.number).sort()).toEqual(["QS-0001", "QS-0002"]);
    expect(snapshot.quotes.find((item) => item.number === "QS-0001")?.status).toBe("declined");
    expect(snapshot.quotes.find((item) => item.number === "QS-0002")?.title).toContain("door knob");
    expect(snapshot.customers.map((item) => item.name).sort()).toEqual(["Jerry", "Tom holland"]);
    expect(snapshot.quoteSeq).toBe(2);
    expect(snapshot.session?.passwordHash).toBe("fnv1a:localhash");
    expect(snapshot.activities.length).toBeGreaterThanOrEqual(3);
  });

  it("does not let an empty cloud workspace delete local quotes", () => {
    const local = snap({
      quoteSeq: 2,
      quotes: [
        quote({ id: "q2", number: "QS-0002", status: "sent", updatedAt: "2026-08-24T03:18:00.000Z" }),
      ],
    });
    const remote = snap({
      quotes: [],
      quoteSeq: 0,
      session: { email, name: "", passwordHash: "fnv1a:thin" },
      business: { ...emptyBusiness(), email, phone: "0273608080" },
    });

    const { snapshot, changed } = mergeSnapshots(local, remote);
    expect(changed).toBe(false);
    expect(snapshot.quotes).toHaveLength(1);
    expect(snapshot.quotes[0].number).toBe("QS-0002");
    expect(snapshot.business.name).toBe("Faz and co.");
    expect(snapshot.quoteSeq).toBe(2);
  });

  it("takes the remote book when this device is empty", () => {
    const local = snap({
      quotes: [],
      customers: [],
      quoteSeq: 0,
      business: { ...emptyBusiness(), email },
    });
    const remote = snap({
      quoteSeq: 1,
      quotes: [quote({ id: "q1", number: "QS-0001", status: "sent" })],
    });

    const { snapshot } = mergeSnapshots(local, remote);
    expect(snapshot.quotes).toHaveLength(1);
    expect(snapshot.business.name).toBe("Faz and co.");
    expect(snapshot.quoteSeq).toBe(1);
  });

  it("does not mix two different accounts", () => {
    const local = snap({
      quotes: [quote({ id: "q1", number: "QS-0001", status: "sent" })],
    });
    const remote = snap({
      session: { email: "sam@halefencing.co.nz", name: "Sam" },
      business: { ...emptyBusiness(), email: "sam@halefencing.co.nz", name: "Hale Fencing" },
      quotes: [quote({ id: "demo", number: "QS-0009", status: "accepted" })],
    });

    const { snapshot, changed } = mergeSnapshots(local, remote);
    expect(changed).toBe(false);
    expect(snapshot.quotes).toHaveLength(1);
    expect(snapshot.quotes[0].number).toBe("QS-0001");
  });

  it("merges the same quote when ids differ but the public token matches", () => {
    const local = snap({
      quotes: [
        quote({
          id: "phone-id",
          number: "QS-0001",
          publicToken: "sharedtok",
          status: "sent",
          updatedAt: "2026-08-24T03:00:00.000Z",
        }),
      ],
    });
    const remote = snap({
      quotes: [
        quote({
          id: "pc-id",
          number: "QS-0001",
          publicToken: "sharedtok",
          status: "declined",
          updatedAt: "2026-08-24T03:21:00.000Z",
        }),
      ],
    });

    const { snapshot } = mergeSnapshots(local, remote);
    expect(snapshot.quotes).toHaveLength(1);
    expect(snapshot.quotes[0].status).toBe("declined");
  });

  it("keeps a paid invoice over an unpaid copy", () => {
    const unpaid: Invoice = invoice({ id: "inv1", number: "INV-0001", status: "unpaid" });
    const paid: Invoice = invoice({
      id: "inv1",
      number: "INV-0001",
      status: "paid",
      paidAt: "2026-08-24T05:00:00.000Z",
    });
    const { snapshot } = mergeSnapshots(snap({ invoices: [unpaid] }), snap({ invoices: [paid] }));
    expect(snapshot.invoices).toHaveLength(1);
    expect(snapshot.invoices[0].status).toBe("paid");
  });

  it("keeps the higher plan", () => {
    const local = snap({ business: { ...emptyBusiness(), name: "Faz and co.", email, plan: "free" } });
    const remote = snap({ business: { ...emptyBusiness(), name: "Faz and co.", email, plan: "business" } });
    expect(mergeSnapshots(local, remote).snapshot.business.plan).toBe("business");
  });

  it("dedupes the same activity logged on two devices", () => {
    const activity: Activity = {
      id: "act_1",
      at: "2026-08-24T03:18:00.000Z",
      message: "Quote sent via email",
      quoteId: "q1",
    };
    const { snapshot } = mergeSnapshots(
      snap({ activities: [activity] }),
      snap({ activities: [{ ...activity, id: "act_other" }] }),
    );
    expect(snapshot.activities).toHaveLength(1);
  });
});
