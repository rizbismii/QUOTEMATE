"use client";

import { pingCloud, type CloudStatus } from "@/lib/supabase-sync";
import { SUPABASE_PROJECT_REF, SUPABASE_URL } from "@/lib/supabase";
import { useEffect, useState } from "react";

const labels: Record<CloudStatus, string> = {
  off: "Cloud sync is off",
  ok: "Connected to Supabase — quotes sync across devices",
  "missing-table": "Supabase is reachable, but the workspaces table is not created yet",
  error: "Could not reach Supabase",
};

export function CloudStatusCard() {
  const [status, setStatus] = useState<CloudStatus>("off");

  useEffect(() => {
    void pingCloud().then(setStatus);
  }, []);

  return (
    <div className="rounded-2xl border border-line bg-card p-4 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-steel">Supabase</p>
      <p className="mt-1 font-semibold">{labels[status]}</p>
      {status === "ok" ? (
        <p className="mt-1 text-xs text-steel">
          Phone, computer and other browsers share one job book. Open Home on both after sending or
          declining a quote.
        </p>
      ) : null}
      {status === "missing-table" ? (
        <a
          className="mt-2 inline-block text-xs font-semibold text-rust"
          href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new`}
          target="_blank"
          rel="noreferrer"
        >
          Open SQL editor and run supabase/migrations
        </a>
      ) : null}
      <p className="mt-1 break-all text-xs text-steel">
        {SUPABASE_PROJECT_REF} · {SUPABASE_URL}
      </p>
    </div>
  );
}
