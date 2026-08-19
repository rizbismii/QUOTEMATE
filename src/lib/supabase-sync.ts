import { DEMO_WORKSPACE_ID, getSupabase } from "./supabase";
import type { AppState } from "./types";

type Snapshot = Omit<AppState, "hydrated">;

export type CloudStatus = "off" | "ok" | "missing-table" | "error";

export async function pingCloud(): Promise<CloudStatus> {
  const client = getSupabase();
  if (!client) return "off";
  const { error } = await client.from("workspaces").select("id").eq("id", DEMO_WORKSPACE_ID).maybeSingle();
  if (!error) return "ok";
  if (error.code === "PGRST205" || error.message?.includes("schema cache")) return "missing-table";
  return "error";
}

export async function pullWorkspace(): Promise<Snapshot | null> {
  const client = getSupabase();
  if (!client) return null;
  const { data, error } = await client
    .from("workspaces")
    .select("payload")
    .eq("id", DEMO_WORKSPACE_ID)
    .maybeSingle();
  if (error || !data?.payload || Object.keys(data.payload as object).length === 0) return null;
  return data.payload as Snapshot;
}

export async function pushWorkspace(snapshot: Snapshot): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.from("workspaces").upsert({
    id: DEMO_WORKSPACE_ID,
    payload: snapshot,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.warn("QuoteSnap cloud sync skipped:", error.message);
  }
}

export function snapshotFromState(state: AppState): Snapshot {
  return {
    session: state.session,
    business: state.business,
    customers: state.customers,
    quotes: state.quotes,
    invoices: state.invoices,
    activities: state.activities,
    quoteSeq: state.quoteSeq,
    invoiceSeq: state.invoiceSeq,
  };
}
