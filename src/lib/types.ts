export type Country = "NZ" | "AU";

export type Trade =
  | "plumber"
  | "electrician"
  | "builder"
  | "painter"
  | "landscaper"
  | "cleaner"
  | "handyman"
  | "other";

export type PlanId = "free" | "starter" | "pro" | "business";

export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "expired"
  | "invoiced";

export type InvoiceStatus = "unpaid" | "paid" | "overdue";

export type LineKind = "labour" | "materials" | "other";

export type SendChannel = "email" | "sms" | "whatsapp" | "link";

export interface Session {
  email: string;
  name: string;
}

export interface Business {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  trade: Trade;
  country: Country;
  city: string;
  region: string;
  address: string;
  gstRegistered: boolean;
  taxNumber: string;
  bankName: string;
  bankAccount: string;
  paymentTermsDays: number;
  ccEmails: string[];
  plan: PlanId;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  suburb: string;
  city: string;
}

export interface Photo {
  id: string;
  dataUrl: string;
  name: string;
}

export interface LineItem {
  id: string;
  kind: LineKind;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface Quote {
  id: string;
  number: string;
  publicToken: string;
  customerId: string;
  jobAddress: string;
  city: string;
  photos: Photo[];
  voiceNote: string;
  title: string;
  description: string;
  photoNotes: string;
  lineItems: LineItem[];
  notes: string;
  validUntil: string;
  status: QuoteStatus;
  sentAt?: string;
  sentVia: SendChannel[];
  acceptedAt?: string;
  declinedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  quoteId: string;
  publicToken: string;
  customerId: string;
  jobAddress: string;
  title: string;
  description: string;
  lineItems: LineItem[];
  photos: Photo[];
  notes: string;
  issuedAt: string;
  dueAt: string;
  status: InvoiceStatus;
  paidAt?: string;
  reminders: { at: string; via: SendChannel }[];
}

export interface Activity {
  id: string;
  at: string;
  message: string;
  quoteId?: string;
  invoiceId?: string;
}

export interface AppState {
  hydrated: boolean;
  session: Session | null;
  business: Business;
  customers: Customer[];
  quotes: Quote[];
  invoices: Invoice[];
  activities: Activity[];
  quoteSeq: number;
  invoiceSeq: number;
}
