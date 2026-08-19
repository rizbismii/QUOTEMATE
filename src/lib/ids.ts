export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function padSeq(seq: number): string {
  return String(seq).padStart(4, "0");
}

export function quoteNumber(seq: number): string {
  return `QS-${padSeq(seq)}`;
}

export function invoiceNumber(seq: number): string {
  return `INV-${padSeq(seq)}`;
}

export function publicToken(): string {
  return Math.random().toString(36).slice(2, 10);
}
