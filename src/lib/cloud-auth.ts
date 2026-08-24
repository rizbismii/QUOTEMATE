import { findSavedAccount, rememberAccount } from "./account-vault";
import { emailsMatch, hashPassword, mobileMatches, passwordIsValid, verifyPassword } from "./auth";
import { emptyBusiness, normalizeBusiness } from "./demo";
import {
  findWorkspaceByEmail,
  pushWorkspace,
  snapshotFromState,
  workspaceIdForEmail,
  type Snapshot,
} from "./supabase-sync";
import { useStore } from "./store";

export async function signInFromCloud(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; reason: "missing" | "password" }> {
  const found = await findWorkspaceByEmail(email);
  if (!found?.snapshot.session) return { ok: false, reason: "missing" };
  const hash = found.snapshot.session.passwordHash;
  if (!hash || !verifyPassword(password, hash)) return { ok: false, reason: "password" };
  useStore.getState().applySnapshot({ ...found.snapshot, signedIn: true }, true);
  return { ok: true };
}

export async function resetPasswordFromCloud(input: {
  email: string;
  mobile: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; reason: "email" | "mobile" | "password" }> {
  if (!passwordIsValid(input.password)) return { ok: false, reason: "password" };
  const found = await findWorkspaceByEmail(input.email);
  if (!found) return { ok: false, reason: "email" };
  const phone = found.snapshot.business?.phone ?? "";
  if (!mobileMatches(phone, input.mobile)) return { ok: false, reason: "mobile" };
  const next: Snapshot = {
    ...found.snapshot,
    signedIn: false,
    session: {
      email: found.snapshot.session?.email || found.snapshot.business.email,
      name: found.snapshot.session?.name || found.snapshot.business.ownerName,
      passwordHash: hashPassword(input.password),
    },
  };
  useStore.getState().applySnapshot(next, false);
  await pushWorkspace(snapshotFromState(useStore.getState()), found.id);
  return { ok: true };
}

export async function recoverAccount(input: {
  email: string;
  mobile: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; reason: "password" }> {
  if (!passwordIsValid(input.password)) return { ok: false, reason: "password" };
  const state = useStore.getState();
  const keepBook = emailsMatch(state.business.email, input.email);
  const passwordHash = hashPassword(input.password);
  const email = input.email.trim();
  const session = {
    email,
    name: keepBook ? state.business.ownerName : "",
    passwordHash,
  };
  const business = keepBook
    ? { ...state.business, email, phone: state.business.phone || input.mobile.trim() }
    : { ...emptyBusiness(), email, phone: input.mobile.trim() };
  useStore.setState({
    signedIn: false,
    session,
    business: normalizeBusiness(business),
  });
  rememberAccount({
    email,
    name: session.name,
    phone: business.phone,
    passwordHash,
  });
  await pushWorkspace(snapshotFromState(useStore.getState()), workspaceIdForEmail(email));
  return { ok: true };
}

export async function resetPasswordAnywhere(input: {
  email: string;
  mobile: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; reason: "mobile" | "password" }> {
  const local = useStore.getState().resetPassword(input);
  if (local.ok) {
    const state = useStore.getState();
    if (state.session?.email) {
      await pushWorkspace(snapshotFromState(state), workspaceIdForEmail(state.session.email));
    }
    return { ok: true };
  }
  if (local.reason === "mobile") return { ok: false, reason: "mobile" };
  if (local.reason === "password") return { ok: false, reason: "password" };

  const cloud = await resetPasswordFromCloud(input);
  if (cloud.ok) return { ok: true };
  if (cloud.reason === "mobile") return { ok: false, reason: "mobile" };
  if (cloud.reason === "password") return { ok: false, reason: "password" };

  return recoverAccount(input);
}

export function vaultPasswordMatches(email: string, password: string): boolean {
  const saved = findSavedAccount(email);
  return Boolean(saved && verifyPassword(password, saved.passwordHash));
}
