import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Hosted QuoteSnap project. Publishable keys are safe in the client. */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qpvufdxaapbvldpcustp.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_26bFCJls3XJtcBDuJGRC_Q_J5GVHHg6";
export const SUPABASE_PROJECT_REF = "qpvufdxaapbvldpcustp";

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    cached = null;
    return cached;
  }
  cached = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return cached;
}

export const DEMO_WORKSPACE_ID = "quotesnap-demo";
