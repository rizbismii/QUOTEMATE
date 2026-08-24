import { emailsMatch, normalizeEmail } from "./auth";

export const ACCOUNT_VAULT_KEY = "quotesnap-accounts-v1";

export interface SavedAccount {
  email: string;
  name: string;
  phone: string;
  passwordHash: string;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readAll(): SavedAccount[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNT_VAULT_KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedAccount[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(accounts: SavedAccount[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ACCOUNT_VAULT_KEY, JSON.stringify(accounts));
}

export function rememberAccount(account: SavedAccount): void {
  if (!account.email || !account.passwordHash) return;
  const next: SavedAccount = {
    email: normalizeEmail(account.email),
    name: account.name,
    phone: account.phone,
    passwordHash: account.passwordHash,
  };
  const accounts = readAll().filter((item) => !emailsMatch(item.email, next.email));
  writeAll([next, ...accounts].slice(0, 8));
}

export function findSavedAccount(email: string): SavedAccount | undefined {
  return readAll().find((item) => emailsMatch(item.email, email));
}
