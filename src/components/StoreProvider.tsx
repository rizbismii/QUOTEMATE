"use client";

import { useEffect, useRef, useState } from "react";
import { rememberAccount } from "@/lib/account-vault";
import { emailsMatch } from "@/lib/auth";
import { DEMO_LOGIN, normalizeBusiness } from "@/lib/demo";
import { mergeSnapshots } from "@/lib/merge-snapshots";
import { getSupabase } from "@/lib/supabase";
import {
  findWorkspaceByEmail,
  pingCloud,
  pushWorkspace,
  snapshotFromState,
  workspaceIdForEmail,
} from "@/lib/supabase-sync";
import { useStore } from "@/lib/store";

function waitForHydrated(): Promise<void> {
  return new Promise((resolve) => {
    const unsub = useStore.subscribe((state) => {
      if (state.hydrated) {
        unsub();
        resolve();
      }
    });
    if (useStore.getState().hydrated) {
      unsub();
      resolve();
    }
  });
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const finished = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let pushTimer: ReturnType<typeof setTimeout> | undefined;
    let unsubStore: (() => void) | undefined;
    let unsubHydrate: (() => void) | undefined;
    let syncing = false;

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

    async function pullAndMerge(): Promise<boolean> {
      const current = useStore.getState();
      if (!current.hydrated || !current.signedIn || !current.session) return false;
      if (emailsMatch(current.session.email, DEMO_LOGIN.email)) return false;

      const email = current.session.email;
      const found = await findWorkspaceByEmail(email);
      if (cancelled) return false;
      if (!found) return true;

      const { snapshot, changed } = mergeSnapshots(snapshotFromState(useStore.getState()), found.snapshot);
      if (changed) useStore.getState().applySnapshot(snapshot, true);
      return true;
    }

    async function pushCurrent() {
      const state = useStore.getState();
      if (!state.hydrated || !state.signedIn || !state.session) return;
      if (emailsMatch(state.session.email, DEMO_LOGIN.email)) return;
      rememberAccount({
        email: state.session.email,
        name: state.session.name,
        phone: state.business.phone,
        passwordHash: state.session.passwordHash || "",
      });
      await pushWorkspace(snapshotFromState(state), workspaceIdForEmail(state.session.email));
    }

    async function syncFromCloud() {
      if (syncing || cancelled || !getSupabase()) return;
      syncing = true;
      try {
        const shouldPush = await pullAndMerge();
        if (shouldPush && !cancelled) await pushCurrent();
      } finally {
        syncing = false;
      }
    }

    async function startCloud() {
      if (!getSupabase()) return;
      const status = await pingCloud();
      if (cancelled || status !== "ok") return;

      await waitForHydrated();
      if (cancelled) return;

      await syncFromCloud();
      if (cancelled) return;

      unsubStore = useStore.subscribe((state, prev) => {
        if (!state.hydrated || !state.session) return;
        if (emailsMatch(state.session.email, DEMO_LOGIN.email)) return;

        const signedInNow = state.signedIn && !prev.signedIn;
        const switchedUser =
          state.signedIn &&
          Boolean(prev.session?.email) &&
          !emailsMatch(prev.session!.email, state.session.email);
        if (state.signedIn && (signedInNow || switchedUser)) {
          void syncFromCloud();
          return;
        }
        if (!state.signedIn) return;

        const id = workspaceIdForEmail(state.session.email);
        if (pushTimer) clearTimeout(pushTimer);
        pushTimer = setTimeout(() => {
          void pushWorkspace(snapshotFromState(state), id);
        }, 600);
      });
    }

    void startCloud();

    const onFocus = () => {
      void syncFromCloud();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void syncFromCloud();
    };
    const onOnline = () => {
      void syncFromCloud();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void syncFromCloud();
    }, 45_000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
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
