import { hashPassword, mobileMatches, passwordIsValid, verifyPassword } from "./auth";
import {
  findWorkspaceByEmail,
  pushWorkspace,
  snapshotFromState,
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
