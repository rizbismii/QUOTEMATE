import { emailsMatch, normalizeEmail } from "./auth";
import { DEMO_LOGIN, normalizeBusiness } from "./demo";
import { DEMO_WORKSPACE_ID, getSupabase } from "./supabase";
import type { AppState, Business, Customer, Invoice, Quote } from "./types";

export type Snapshot = Omit<AppState, "hydrated">;

export type CloudStatus = "off" | "ok" | "missing-table" | "error";

export function workspaceIdForEmail(email: string): string {
  const normalized = normalizeEmail(email);
  if (!normalized || emailsMatch(normalized, DEMO_LOGIN.email)) return DEMO_WORKSPACE_ID;
  return `qs-${normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function snapshotEmails(snapshot: Partial<AppState> | null | undefined): string[] {
  return [snapshot?.session?.email, snapshot?.business?.email].filter(Boolean) as string[];
}

function snapshotMatchesEmail(snapshot: Partial<AppState> | null | undefined, email: string): boolean {
  return snapshotEmails(snapshot).some((item) => emailsMatch(item, email));
}

export async function pingCloud(): Promise<CloudStatus> {
  const client = getSupabase();
  if (!client) return "off";
  const { error } = await client.from("workspaces").select("id").eq("id", DEMO_WORKSPACE_ID).maybeSingle();
  if (!error) return "ok";
  if (error.code === "PGRST205" || error.message?.includes("schema cache")) return "missing-table";
  return "error";
}

export async function pullWorkspace(id: string = DEMO_WORKSPACE_ID): Promise<Snapshot | null> {
  const client = getSupabase();
  if (!client) return null;
  const { data, error } = await client.from("workspaces").select("payload").eq("id", id).maybeSingle();
  if (error || !data?.payload || Object.keys(data.payload as object).length === 0) return null;
  return data.payload as Snapshot;
}

export async function pushWorkspace(snapshot: Snapshot, id?: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const workspaceId = id || workspaceIdForEmail(snapshot.session?.email || snapshot.business.email);
  const { error } = await client.from("workspaces").upsert({
    id: workspaceId,
    payload: snapshot,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.warn("QuoteSnap cloud sync skipped:", error.message);
  }
}

export async function findWorkspaceByEmail(
  email: string,
): Promise<{ id: string; snapshot: Snapshot } | null> {
  const client = getSupabase();
  if (!client || !email.trim()) return null;
  const directId = workspaceIdForEmail(email);
  const direct = await pullWorkspace(directId);
  if (direct && snapshotMatchesEmail(direct, email)) return { id: directId, snapshot: direct };

  const { data, error } = await client.from("workspaces").select("id, payload");
  if (error || !data?.length) return null;
  for (const row of data) {
    const payload = row.payload as Snapshot | null;
    if (snapshotMatchesEmail(payload, email)) {
      return { id: row.id as string, snapshot: payload as Snapshot };
    }
  }
  return null;
}

export async function findPublicInvoice(token: string): Promise<{
  invoice: Invoice;
  business: Business;
  customer?: Customer;
} | null> {
  const found = await findPublicRecord(token, "invoice");
  if (!found || found.kind !== "invoice") return null;
  return { invoice: found.invoice, business: found.business, customer: found.customer };
}

export async function findPublicQuote(token: string): Promise<{
  quote: Quote;
  business: Business;
  customer?: Customer;
  workspaceId: string;
} | null> {
  const found = await findPublicRecord(token, "quote");
  if (!found || found.kind !== "quote") return null;
  return {
    quote: found.quote,
    business: found.business,
    customer: found.customer,
    workspaceId: found.workspaceId,
  };
}

async function findPublicRecord(token: string, kind: "quote" | "invoice") {
  const client = getSupabase();
  if (!client || !token) return null;
  const { data, error } = await client.from("workspaces").select("id, payload");
  if (error || !data?.length) return null;
  for (const row of data) {
    const payload = row.payload as Partial<AppState> | null;
    if (kind === "invoice") {
      const invoice = (payload?.invoices ?? []).find((item) => item.publicToken === token);
      if (!invoice) continue;
      const customer = (payload?.customers ?? []).find((item) => item.id === invoice.customerId);
      return {
        kind: "invoice" as const,
        invoice,
        business: normalizeBusiness(payload?.business),
        customer,
        workspaceId: row.id as string,
      };
    }
    const quote = (payload?.quotes ?? []).find((item) => item.publicToken === token);
    if (!quote) continue;
    const customer = (payload?.customers ?? []).find((item) => item.id === quote.customerId);
    return {
      kind: "quote" as const,
      quote,
      business: normalizeBusiness(payload?.business),
      customer,
      workspaceId: row.id as string,
    };
  }
  return null;
}

export async function patchPublicQuote(
  token: string,
  patch: Partial<Quote>,
): Promise<Quote | undefined> {
  const client = getSupabase();
  if (!client || !token) return undefined;
  const { data, error } = await client.from("workspaces").select("id, payload");
  if (error || !data?.length) return undefined;
  for (const row of data) {
    const payload = row.payload as Snapshot | null;
    const quotes = payload?.quotes ?? [];
    const index = quotes.findIndex((item) => item.publicToken === token);
    if (index < 0 || !payload) continue;
    const next = quotes.map((item) =>
      item.publicToken === token ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
    );
    const snapshot = { ...payload, quotes: next };
    await pushWorkspace(snapshot, row.id as string);
    return next[index];
  }
  return undefined;
}

export function snapshotFromState(state: AppState): Snapshot {
  return {
    signedIn: state.signedIn,
    session: state.session
      ? {
          email: state.session.email,
          name: state.session.name,
          passwordHash: state.session.passwordHash,
        }
      : null,
    business: normalizeBusiness(state.business),
    customers: state.customers,
    quotes: state.quotes,
    invoices: state.invoices,
    activities: state.activities,
    quoteSeq: state.quoteSeq,
    invoiceSeq: state.invoiceSeq,
  };
}
