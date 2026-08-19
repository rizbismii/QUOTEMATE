"use client";

import { useEffect, useState } from "react";
import { pullWorkspace, pushWorkspace, snapshotFromState } from "@/lib/supabase-sync";
import { getSupabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pushTimer: ReturnType<typeof setTimeout> | undefined;
    let unsubStore: (() => void) | undefined;

    const finish = () => {
      useStore.setState({ hydrated: true });
      setReady(true);
    };

    const unsubHydrate = useStore.persist.onFinishHydration(finish);
    useStore.persist.rehydrate();
    if (useStore.persist.hasHydrated()) finish();

    async function syncCloud() {
      if (!getSupabase()) return;
      const remote = await pullWorkspace();
      if (cancelled) return;
      if (remote?.session) {
        useStore.setState({ ...remote, hydrated: true });
      }
      unsubStore = useStore.subscribe((state) => {
        if (pushTimer) clearTimeout(pushTimer);
        pushTimer = setTimeout(() => {
          void pushWorkspace(snapshotFromState(state));
        }, 600);
      });
    }

    void syncCloud();

    return () => {
      cancelled = true;
      unsubHydrate();
      unsubStore?.();
      if (pushTimer) clearTimeout(pushTimer);
    };
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper text-ink">
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-ink text-paper shadow-lg">
            <span className="font-display text-xl tracking-tight">QS</span>
          </div>
          <p className="font-display text-lg">QuoteSnap</p>
          <p className="mt-1 text-sm text-steel">Loading your job book…</p>
        </div>
      </div>
    );
  }

  return children;
}
