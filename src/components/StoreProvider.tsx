"use client";

import { useEffect, useRef, useState } from "react";
import { emailsMatch } from "@/lib/auth";
import { DEMO_LOGIN, normalizeBusiness } from "@/lib/demo";
import { pingCloud, pullWorkspace, pushWorkspace, snapshotFromState } from "@/lib/supabase-sync";
import { getSupabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const finished = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let pushTimer: ReturnType<typeof setTimeout> | undefined;
    let unsubStore: (() => void) | undefined;
    let unsubHydrate: (() => void) | undefined;

    const finish = () => {
      if (finished.current || cancelled) return;
      finished.current = true;
      useStore.setState({
        hydrated: true,
        business: normalizeBusiness(useStore.getState().business),
        invoices: useStore.getState().invoices ?? [],
        customers: useStore.getState().customers ?? [],
        quotes: useStore.getState().quotes ?? [],
      });
      setReady(true);
    };

    try {
      unsubHydrate = useStore.persist.onFinishHydration(finish);
      void Promise.resolve(useStore.persist.rehydrate()).catch(finish);
      if (useStore.persist.hasHydrated()) finish();
    } catch {
      finish();
    }
    const timeout = window.setTimeout(finish, 2500);

    async function syncCloud() {
      if (!getSupabase()) return;
      const status = await pingCloud();
      if (cancelled || status !== "ok") return;
      const remote = await pullWorkspace();
      if (cancelled) return;
      if (remote?.session) {
        const local = useStore.getState();
        const sameAccount =
          Boolean(local.session) &&
          emailsMatch(local.session?.email ?? "", remote.session.email);
        const keepLocalAccount = Boolean(local.session && !sameAccount);
        if (!keepLocalAccount) {
          useStore.setState({
            ...remote,
            signedIn: sameAccount ? local.signedIn : Boolean(remote.session),
            session: {
              email: remote.session.email,
              name: remote.session.name,
              passwordHash: sameAccount ? local.session?.passwordHash : remote.session.passwordHash,
            },
            business: normalizeBusiness(remote.business),
            customers: remote.customers ?? [],
            quotes: remote.quotes ?? [],
            invoices: remote.invoices ?? [],
            activities: remote.activities ?? [],
            hydrated: true,
          });
        }
      }
      unsubStore = useStore.subscribe((state) => {
        if (!state.signedIn || !state.session) return;
        if (!emailsMatch(state.session.email, DEMO_LOGIN.email)) return;
        if (pushTimer) clearTimeout(pushTimer);
        pushTimer = setTimeout(() => {
          void pushWorkspace(snapshotFromState(state));
        }, 600);
      });
    }

    void syncCloud();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      unsubHydrate?.();
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
