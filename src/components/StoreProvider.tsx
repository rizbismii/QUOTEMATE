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
  subscribeWorkspace,
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
    let unsubRealtime: (() => void) | undefined;
    let syncing = false;
    let applyingRemote = false;
    let pendingSync = false;
    let wantPush = false;

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

    async function pullAndMerge(): Promise<{ ok: boolean; changed: boolean }> {
      const current = useStore.getState();
      if (!current.hydrated || !current.signedIn || !current.session) return { ok: false, changed: false };
      if (emailsMatch(current.session.email, DEMO_LOGIN.email)) return { ok: true, changed: false };

      const email = current.session.email;
      const found = await findWorkspaceByEmail(email);
      if (cancelled) return { ok: false, changed: false };
      if (!found) return { ok: true, changed: false };

      const { snapshot, changed } = mergeSnapshots(snapshotFromState(useStore.getState()), found.snapshot);
      if (changed) {
        applyingRemote = true;
        useStore.getState().applySnapshot(snapshot, true);
        applyingRemote = false;
      }
      return { ok: true, changed };
    }

    async function pushCurrent() {
      const state = useStore.getState();
      if (!state.hydrated || !state.signedIn || !state.session) return;
      rememberAccount({
        email: state.session.email,
        name: state.session.name,
        phone: state.business.phone,
        passwordHash: state.session.passwordHash || "",
      });
      await pushWorkspace(snapshotFromState(state), workspaceIdForEmail(state.session.email));
    }

    async function syncFromCloud() {
      if (cancelled || !getSupabase()) return;
      if (syncing) {
        pendingSync = true;
        return;
      }
      syncing = true;
      try {
        const pulled = await pullAndMerge();
        if (!pulled.ok || cancelled) return;
        if (pulled.changed || wantPush) {
          wantPush = false;
          await pushCurrent();
        }
      } finally {
        syncing = false;
        if (pendingSync && !cancelled) {
          pendingSync = false;
          void syncFromCloud();
        }
      }
    }

    function listenRealtime(email?: string) {
      unsubRealtime?.();
      unsubRealtime = undefined;
      if (!email || emailsMatch(email, DEMO_LOGIN.email)) return;
      unsubRealtime = subscribeWorkspace(workspaceIdForEmail(email), () => {
        void syncFromCloud();
      });
    }

    function scheduleSync() {
      wantPush = true;
      if (pushTimer) clearTimeout(pushTimer);
      pushTimer = setTimeout(() => {
        void syncFromCloud();
      }, 500);
    }

    async function startCloud() {
      if (!getSupabase()) return;
      const status = await pingCloud();
      if (cancelled || status !== "ok") return;

      await waitForHydrated();
      if (cancelled) return;

      wantPush = true;
      await syncFromCloud();
      if (cancelled) return;

      listenRealtime(useStore.getState().session?.email);

      unsubStore = useStore.subscribe((state, prev) => {
        if (!state.hydrated || !state.session) return;
        if (applyingRemote) return;

        const isDemo = emailsMatch(state.session.email, DEMO_LOGIN.email);
        const signedInNow = state.signedIn && !prev.signedIn;
        const switchedUser =
          state.signedIn &&
          Boolean(prev.session?.email) &&
          !emailsMatch(prev.session!.email, state.session.email);
        if (state.signedIn && (signedInNow || switchedUser)) {
          listenRealtime(isDemo ? undefined : state.session.email);
          if (!isDemo) {
            wantPush = true;
            void syncFromCloud();
          }
          return;
        }
        if (!state.signedIn) {
          unsubRealtime?.();
          unsubRealtime = undefined;
          return;
        }
        scheduleSync();
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
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "quotesnap-v2") return;
      void Promise.resolve(useStore.persist.rehydrate()).then(() => {
        void syncFromCloud();
      });
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    window.addEventListener("storage", onStorage);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void syncFromCloud();
    }, 8_000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("storage", onStorage);
      unsubHydrate?.();
      unsubStore?.();
      unsubRealtime?.();
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
