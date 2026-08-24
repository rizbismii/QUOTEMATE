export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function emailsMatch(a: string, b: string): boolean {
  return normalizeEmail(a) === normalizeEmail(b);
}

export function hashPassword(password: string): string {
  let hash = 2166136261;
  const value = password.normalize("NFC");
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function passwordIsValid(password: string): boolean {
  return password.trim().length >= 6;
}

export function verifyPassword(password: string, passwordHash?: string): boolean {
  if (!passwordHash) return false;
  return hashPassword(password) === passwordHash;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function mobileMatches(stored: string, provided: string): boolean {
  const saved = digitsOnly(stored);
  const given = digitsOnly(provided);
  if (!saved || !given) return false;
  if (saved === given) return true;
  if (given.length >= 4 && saved.endsWith(given)) return true;
  return given.length === 4 && saved.endsWith(given);
}

export function publicSession(session: { email: string; name: string; passwordHash?: string } | null) {
  if (!session) return null;
  return { email: session.email, name: session.name };
}
