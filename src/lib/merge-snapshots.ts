import { emailsMatch, normalizeEmail } from "./auth";
import { normalizeBusiness } from "./demo";
import type { Snapshot } from "./supabase-sync";
import type {
  Activity,
  Business,
  Customer,
  Invoice,
  PlanId,
  Quote,
  QuoteStatus,
  Session,
} from "./types";

const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  business: 3,
};

const QUOTE_STATUS_RANK: Record<QuoteStatus, number> = {
  draft: 0,
  sent: 1,
  expired: 1,
  declined: 2,
  accepted: 3,
  invoiced: 4,
};

function pickStr(local: string | undefined, remote: string | undefined): string {
  return (local || "").trim() ? (local as string) : remote || "";
}

function higherPlan(a?: PlanId, b?: PlanId): PlanId {
  const left = a && a in PLAN_RANK ? a : "free";
  const right = b && b in PLAN_RANK ? b : "free";
  return (PLAN_RANK[left] ?? 0) >= (PLAN_RANK[right] ?? 0) ? left : right;
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function seqFromQuoteNumbers(quotes: Quote[], current: number): number {
  let max = current || 0;
  for (const quote of quotes) {
    const match = /^QS-(\d+)$/i.exec(quote.number || "");
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max;
}

function seqFromInvoiceNumbers(invoices: Invoice[], current: number): number {
  let max = current || 0;
  for (const invoice of invoices) {
    const match = /^INV-(\d+)$/i.exec(invoice.number || "");
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max;
}

function quoteStamp(quote: Quote): number {
  const raw = quote.updatedAt || quote.declinedAt || quote.acceptedAt || quote.sentAt || quote.createdAt;
  const value = Date.parse(raw || "");
  return Number.isFinite(value) ? value : 0;
}

function pickQuote(local: Quote, remote: Quote): Quote {
  const localTime = quoteStamp(local);
  const remoteTime = quoteStamp(remote);
  if (remoteTime !== localTime) return remoteTime > localTime ? remote : local;
  const localRank = QUOTE_STATUS_RANK[local.status] ?? 0;
  const remoteRank = QUOTE_STATUS_RANK[remote.status] ?? 0;
  if (remoteRank !== localRank) return remoteRank > localRank ? remote : local;
  return local;
}

function invoiceStamp(invoice: Invoice): number {
  const raw = invoice.paidAt || invoice.issuedAt;
  const value = Date.parse(raw || "");
  return Number.isFinite(value) ? value : 0;
}

function pickInvoice(local: Invoice, remote: Invoice): Invoice {
  if (local.status === "paid" && remote.status !== "paid") return local;
  if (remote.status === "paid" && local.status !== "paid") return remote;
  return invoiceStamp(remote) > invoiceStamp(local) ? remote : local;
}

function pickCustomer(local: Customer, remote: Customer): Customer {
  return {
    id: local.id || remote.id,
    name: pickStr(local.name, remote.name),
    email: pickStr(local.email, remote.email),
    phone: pickStr(local.phone, remote.phone),
    address: pickStr(local.address, remote.address),
    suburb: pickStr(local.suburb, remote.suburb),
    city: pickStr(local.city, remote.city),
  };
}

function quoteKeys(quote: Quote): string[] {
  return [
    quote.id && `id:${quote.id}`,
    quote.publicToken && `token:${quote.publicToken}`,
    quote.number && quote.customerId && `num:${quote.number}:${quote.customerId}`,
  ].filter(Boolean) as string[];
}

function invoiceKeys(invoice: Invoice): string[] {
  return [
    invoice.id && `id:${invoice.id}`,
    invoice.publicToken && `token:${invoice.publicToken}`,
    invoice.number && `num:${invoice.number}`,
  ].filter(Boolean) as string[];
}

function customerKeys(customer: Customer): string[] {
  return [
    customer.id && `id:${customer.id}`,
    customer.email && `email:${normalizeEmail(customer.email)}`,
  ].filter(Boolean) as string[];
}

function mergeKeyed<T>(
  local: T[],
  remote: T[],
  keysFor: (item: T) => string[],
  pick: (localItem: T, remoteItem: T) => T,
): T[] {
  const result = [...local];
  const indexByKey = new Map<string, number>();

  function indexItem(item: T, index: number) {
    for (const key of keysFor(item)) {
      if (!indexByKey.has(key)) indexByKey.set(key, index);
    }
  }

  result.forEach(indexItem);

  for (const item of remote) {
    let found = -1;
    for (const key of keysFor(item)) {
      const index = indexByKey.get(key);
      if (index !== undefined) {
        found = index;
        break;
      }
    }
    if (found < 0) {
      const nextIndex = result.length;
      result.push(item);
      indexItem(item, nextIndex);
      continue;
    }
    result[found] = pick(result[found], item);
    indexItem(result[found], found);
  }
  return result;
}

function mergeActivities(local: Activity[], remote: Activity[]): Activity[] {
  const seen = new Set<string>();
  const out: Activity[] = [];
  for (const item of [...local, ...remote]) {
    const idKey = item.id ? `id:${item.id}` : "";
    const stampKey = `msg:${item.at}|${item.message}|${item.quoteId || ""}|${item.invoiceId || ""}`;
    const key = idKey || stampKey;
    if (seen.has(key) || seen.has(stampKey)) continue;
    if (idKey) seen.add(idKey);
    seen.add(stampKey);
    out.push(item);
  }
  return out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 40);
}

function mergeBusiness(local: Business, remote: Business): Business {
  const localFilled = Boolean(local.name?.trim());
  const a = localFilled ? local : remote;
  const b = localFilled ? remote : local;
  return normalizeBusiness({
    name: pickStr(a.name, b.name),
    ownerName: pickStr(a.ownerName, b.ownerName),
    email: pickStr(a.email, b.email),
    phone: pickStr(a.phone, b.phone),
    trade: a.trade || b.trade,
    country: a.country || b.country,
    city: pickStr(a.city, b.city),
    region: pickStr(a.region, b.region),
    address: pickStr(a.address, b.address),
    registrationNumber: pickStr(a.registrationNumber, b.registrationNumber),
    gstRegistered: a.gstRegistered,
    taxNumber: pickStr(a.taxNumber, b.taxNumber),
    bankName: pickStr(a.bankName, b.bankName),
    bankAccount: pickStr(a.bankAccount, b.bankAccount),
    paymentTermsDays: a.paymentTermsDays || b.paymentTermsDays || 7,
    ccEmails: unique([...(local.ccEmails || []), ...(remote.ccEmails || [])]),
    plan: higherPlan(local.plan, remote.plan),
    logoDataUrl: pickStr(a.logoDataUrl, b.logoDataUrl),
    payButtonUrl: pickStr(a.payButtonUrl, b.payButtonUrl),
    acceptVisa: a.acceptVisa,
    acceptMastercard: a.acceptMastercard,
    acceptBankTransfer: a.acceptBankTransfer,
  });
}

function mergeSession(local: Session | null, remote: Session | null): Session | null {
  if (!local && !remote) return null;
  return {
    email: pickStr(local?.email, remote?.email),
    name: pickStr(local?.name, remote?.name),
    passwordHash: local?.passwordHash || remote?.passwordHash,
  };
}

function fingerprint(snapshot: Snapshot): string {
  return JSON.stringify({
    signedIn: snapshot.signedIn,
    session: snapshot.session
      ? {
          email: snapshot.session.email,
          name: snapshot.session.name,
          passwordHash: snapshot.session.passwordHash || "",
        }
      : null,
    business: snapshot.business,
    quotes: [...(snapshot.quotes ?? [])]
      .map((quote) => [quote.id, quote.status, quote.updatedAt, quote.number])
      .sort(),
    invoices: [...(snapshot.invoices ?? [])]
      .map((invoice) => [invoice.id, invoice.status, invoice.paidAt, invoice.number])
      .sort(),
    customers: [...(snapshot.customers ?? [])].map((customer) => [customer.id, customer.email]).sort(),
    activities: [...(snapshot.activities ?? [])].map((activity) => activity.id).sort(),
    quoteSeq: snapshot.quoteSeq,
    invoiceSeq: snapshot.invoiceSeq,
  });
}

function snapshotEmail(snapshot: Snapshot): string {
  return snapshot.session?.email || snapshot.business?.email || "";
}

export function mergeSnapshots(
  local: Snapshot,
  remote: Snapshot,
): { snapshot: Snapshot; changed: boolean } {
  const localEmail = snapshotEmail(local);
  const remoteEmail = snapshotEmail(remote);
  if (localEmail && remoteEmail && !emailsMatch(localEmail, remoteEmail)) {
    return { snapshot: local, changed: false };
  }

  const quotes = mergeKeyed(local.quotes ?? [], remote.quotes ?? [], quoteKeys, pickQuote);
  const invoices = mergeKeyed(local.invoices ?? [], remote.invoices ?? [], invoiceKeys, pickInvoice);
  const customers = mergeKeyed(local.customers ?? [], remote.customers ?? [], customerKeys, pickCustomer);
  const activities = mergeActivities(local.activities ?? [], remote.activities ?? []);
  const business = mergeBusiness(
    normalizeBusiness(local.business),
    normalizeBusiness(remote.business),
  );
  const snapshot: Snapshot = {
    signedIn: Boolean(local.signedIn || remote.signedIn),
    session: mergeSession(local.session, remote.session),
    business,
    customers,
    quotes,
    invoices,
    activities,
    quoteSeq: seqFromQuoteNumbers(quotes, Math.max(local.quoteSeq || 0, remote.quoteSeq || 0)),
    invoiceSeq: seqFromInvoiceNumbers(invoices, Math.max(local.invoiceSeq || 0, remote.invoiceSeq || 0)),
  };

  return { snapshot, changed: fingerprint(local) !== fingerprint(snapshot) };
}
