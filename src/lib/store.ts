"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateJob } from "./ai";
import { emailsMatch, hashPassword, mobileMatches, passwordIsValid, verifyPassword } from "./auth";
import { emptyBusiness, demoState, DEMO_LOGIN, normalizeBusiness } from "./demo";
import { invoiceNumber, publicToken, quoteNumber, uid } from "./ids";
import { addDays, todayIso } from "./money";
import { canCreateQuote, planById } from "./plans";
import type {
  AppState,
  Business,
  Customer,
  Invoice,
  Photo,
  PlanId,
  Quote,
  SendChannel,
  Session,
} from "./types";

const blank = (): Omit<AppState, "hydrated"> => ({
  signedIn: false,
  session: null,
  business: emptyBusiness(),
  customers: [],
  quotes: [],
  invoices: [],
  activities: [],
  quoteSeq: 0,
  invoiceSeq: 0,
});

interface Actions {
  setHydrated: (value: boolean) => void;
  login: (session: Session) => void;
  signIn: (
    email: string,
    password: string,
  ) => { ok: true } | { ok: false; reason: "missing" | "email" | "password" };
  register: (input: {
    ownerName: string;
    email: string;
    password: string;
    businessName: string;
    trade: Business["trade"];
    country: Business["country"];
    city: string;
    phone: string;
    address: string;
    registrationNumber: string;
    taxNumber: string;
    gstRegistered: boolean;
  }) => { ok: true } | { ok: false; reason: "password" };
  resetPassword: (input: {
    email: string;
    mobile: string;
    password: string;
  }) => { ok: true } | { ok: false; reason: "email" | "mobile" | "password" };
  applySnapshot: (snapshot: Omit<AppState, "hydrated">, signedIn: boolean) => void;
  loadDemo: () => void;
  logout: () => void;
  updateBusiness: (patch: Partial<Business>) => void;
  setPlan: (plan: PlanId) => void;
  upsertCustomer: (customer: Customer) => void;
  createQuote: (input: {
    customer: Omit<Customer, "id"> & { id?: string };
    jobAddress: string;
    city: string;
    photos: Photo[];
    voiceNote: string;
  }) => { ok: true; quote: Quote } | { ok: false; reason: "limit" };
  updateQuote: (id: string, patch: Partial<Quote>) => void;
  generateQuoteAi: (id: string) => void;
  sendQuote: (id: string, via: SendChannel) => void;
  acceptQuote: (token: string) => Quote | undefined;
  declineQuote: (token: string) => Quote | undefined;
  deleteQuote: (id: string) => void;
  convertToInvoice: (quoteId: string) => { ok: true; invoice: Invoice } | { ok: false; reason: "plan" | "missing" };
  markInvoicePaid: (id: string) => void;
  sendReminder: (id: string, via: SendChannel) => void;
}

export const useStore = create<AppState & Actions>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...blank(),

      setHydrated: (value) => set({ hydrated: value }),

      login: (session) => set({ session, signedIn: true }),

      signIn: (email, password) => {
        if (emailsMatch(email, DEMO_LOGIN.email) && password === DEMO_LOGIN.password) {
          set({ ...demoState(), signedIn: true });
          return { ok: true };
        }
        const session = get().session;
        if (!session) return { ok: false, reason: "missing" };
        if (!emailsMatch(session.email, email)) return { ok: false, reason: "email" };
        if (!session.passwordHash) {
          set({ session: { ...session, passwordHash: hashPassword(password) }, signedIn: true });
          return { ok: true };
        }
        if (!verifyPassword(password, session.passwordHash)) {
          return { ok: false, reason: "password" };
        }
        set({ signedIn: true });
        return { ok: true };
      },

      register: (input) => {
        if (!passwordIsValid(input.password)) return { ok: false, reason: "password" };
        set({
          signedIn: true,
          session: {
            email: input.email.trim(),
            name: input.ownerName.trim(),
            passwordHash: hashPassword(input.password),
          },
          business: {
            ...emptyBusiness(),
            name: input.businessName.trim(),
            ownerName: input.ownerName.trim(),
            email: input.email.trim(),
            phone: input.phone.trim(),
            trade: input.trade,
            country: input.country,
            city: input.city.trim(),
            region: input.city.trim(),
            address: input.address.trim(),
            registrationNumber: input.registrationNumber.trim(),
            taxNumber: input.taxNumber.trim(),
            plan: "free",
            gstRegistered: input.gstRegistered,
            paymentTermsDays: 7,
            ccEmails: [input.email.trim()],
          },
          customers: [],
          quotes: [],
          invoices: [],
          activities: [
            {
              id: uid("act"),
              at: new Date().toISOString(),
              message: `Welcome to QuoteSnap — ${input.businessName} is ready to quote.`,
            },
          ],
          quoteSeq: 0,
          invoiceSeq: 0,
        });
        return { ok: true };
      },

      resetPassword: (input) => {
        const state = get();
        const localEmail = state.session?.email || state.business.email;
        if (!localEmail || !emailsMatch(localEmail, input.email)) {
          return { ok: false, reason: "email" };
        }
        if (!mobileMatches(state.business.phone, input.mobile)) {
          return { ok: false, reason: "mobile" };
        }
        if (!passwordIsValid(input.password)) return { ok: false, reason: "password" };
        set({
          session: {
            email: state.session?.email || state.business.email,
            name: state.session?.name || state.business.ownerName,
            passwordHash: hashPassword(input.password),
          },
        });
        return { ok: true };
      },

      applySnapshot: (snapshot, signedIn) =>
        set({
          signedIn,
          session: snapshot.session ?? null,
          business: normalizeBusiness(snapshot.business),
          customers: snapshot.customers ?? [],
          quotes: snapshot.quotes ?? [],
          invoices: snapshot.invoices ?? [],
          activities: snapshot.activities ?? [],
          quoteSeq: snapshot.quoteSeq ?? 0,
          invoiceSeq: snapshot.invoiceSeq ?? 0,
        }),

      loadDemo: () => set(demoState()),

      logout: () => set({ signedIn: false }),

      updateBusiness: (patch) =>
        set((state) => ({ business: { ...state.business, ...patch } })),

      setPlan: (plan) =>
        set((state) => ({
          business: { ...state.business, plan },
          activities: [
            {
              id: uid("act"),
              at: new Date().toISOString(),
              message: `Plan updated to ${planById(plan).name}`,
            },
            ...state.activities,
          ].slice(0, 40),
        })),

      upsertCustomer: (customer) =>
        set((state) => {
          const exists = state.customers.some((item) => item.id === customer.id);
          return {
            customers: exists
              ? state.customers.map((item) => (item.id === customer.id ? customer : item))
              : [...state.customers, customer],
          };
        }),

      createQuote: (input) => {
        const state = get();
        if (!canCreateQuote(state.business.plan, state.quotes)) {
          return { ok: false, reason: "limit" };
        }
        const customerId = input.customer.id || uid("cus");
        const customer: Customer = {
          id: customerId,
          name: input.customer.name,
          email: input.customer.email,
          phone: input.customer.phone,
          address: input.customer.address,
          suburb: input.customer.suburb,
          city: input.customer.city,
        };
        const seq = state.quoteSeq + 1;
        const generated = generateJob({
          voiceNote: input.voiceNote,
          trade: state.business.trade,
          country: state.business.country,
          city: input.city,
          jobAddress: input.jobAddress,
          photoCount: input.photos.length,
          enhancedAi: planById(state.business.plan).enhancedAi,
        });
        const quote: Quote = {
          id: uid("quo"),
          number: quoteNumber(seq),
          publicToken: publicToken(),
          customerId,
          jobAddress: input.jobAddress,
          city: input.city,
          photos: input.photos,
          voiceNote: input.voiceNote,
          title: generated.title,
          description: generated.description,
          photoNotes: generated.photoNotes,
          lineItems: generated.lineItems,
          notes: "",
          validUntil: addDays(todayIso(), 30),
          status: "draft",
          sentVia: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({
          quoteSeq: seq,
          customers: state.customers.some((item) => item.id === customerId)
            ? state.customers.map((item) => (item.id === customerId ? customer : item))
            : [...state.customers, customer],
          quotes: [quote, ...state.quotes],
          activities: [
            {
              id: uid("act"),
              at: new Date().toISOString(),
              message: `Draft quote ${quote.number} created`,
              quoteId: quote.id,
            },
            ...state.activities,
          ].slice(0, 40),
        });
        return { ok: true, quote };
      },

      updateQuote: (id, patch) =>
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === id ? { ...quote, ...patch, updatedAt: new Date().toISOString() } : quote,
          ),
        })),

      generateQuoteAi: (id) => {
        const state = get();
        const quote = state.quotes.find((item) => item.id === id);
        if (!quote) return;
        const generated = generateJob({
          voiceNote: quote.voiceNote,
          trade: state.business.trade,
          country: state.business.country,
          city: quote.city,
          jobAddress: quote.jobAddress,
          photoCount: quote.photos.length,
          enhancedAi: planById(state.business.plan).enhancedAi,
        });
        get().updateQuote(id, generated);
      },

      sendQuote: (id, via) =>
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === id
              ? {
                  ...quote,
                  status: quote.status === "draft" ? "sent" : quote.status,
                  sentAt: quote.sentAt ?? new Date().toISOString(),
                  sentVia: quote.sentVia.includes(via) ? quote.sentVia : [...quote.sentVia, via],
                  updatedAt: new Date().toISOString(),
                }
              : quote,
          ),
          activities: [
            {
              id: uid("act"),
              at: new Date().toISOString(),
              message: `Quote sent via ${via}`,
              quoteId: id,
            },
            ...state.activities,
          ].slice(0, 40),
        })),

      acceptQuote: (token) => {
        const quote = get().quotes.find((item) => item.publicToken === token);
        if (!quote || quote.status === "invoiced") return quote;
        set((state) => ({
          quotes: state.quotes.map((item) =>
            item.publicToken === token
              ? {
                  ...item,
                  status: "accepted",
                  acceptedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
          activities: [
            {
              id: uid("act"),
              at: new Date().toISOString(),
              message: `Customer accepted ${quote.number}`,
              quoteId: quote.id,
            },
            ...state.activities,
          ].slice(0, 40),
        }));
        return get().quotes.find((item) => item.publicToken === token);
      },

      declineQuote: (token) => {
        const quote = get().quotes.find((item) => item.publicToken === token);
        if (!quote) return quote;
        set((state) => ({
          quotes: state.quotes.map((item) =>
            item.publicToken === token
              ? {
                  ...item,
                  status: "declined",
                  declinedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        }));
        return get().quotes.find((item) => item.publicToken === token);
      },

      deleteQuote: (id) =>
        set((state) => ({ quotes: state.quotes.filter((quote) => quote.id !== id) })),

      convertToInvoice: (quoteId) => {
        const state = get();
        if (!planById(state.business.plan).invoices) return { ok: false, reason: "plan" };
        const quote = state.quotes.find((item) => item.id === quoteId);
        if (!quote) return { ok: false, reason: "missing" };
        const existing = state.invoices.find((item) => item.quoteId === quoteId);
        if (existing) return { ok: true, invoice: existing };
        const seq = state.invoiceSeq + 1;
        const invoice: Invoice = {
          id: uid("inv"),
          number: invoiceNumber(seq),
          quoteId,
          publicToken: publicToken(),
          customerId: quote.customerId,
          jobAddress: quote.jobAddress,
          title: quote.title,
          description: quote.description,
          lineItems: quote.lineItems,
          photos: quote.photos,
          notes: `Converted from ${quote.number}. Please pay by the due date.`,
          issuedAt: todayIso(),
          dueAt: addDays(todayIso(), state.business.paymentTermsDays),
          status: "unpaid",
          reminders: [],
        };
        set({
          invoiceSeq: seq,
          invoices: [invoice, ...state.invoices],
          quotes: state.quotes.map((item) =>
            item.id === quoteId ? { ...item, status: "invoiced", updatedAt: new Date().toISOString() } : item,
          ),
          activities: [
            {
              id: uid("act"),
              at: new Date().toISOString(),
              message: `${quote.number} converted to ${invoice.number}`,
              quoteId,
              invoiceId: invoice.id,
            },
            ...state.activities,
          ].slice(0, 40),
        });
        return { ok: true, invoice };
      },

      markInvoicePaid: (id) =>
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === id
              ? { ...invoice, status: "paid", paidAt: todayIso() }
              : invoice,
          ),
          activities: [
            {
              id: uid("act"),
              at: new Date().toISOString(),
              message: "Invoice marked paid",
              invoiceId: id,
            },
            ...state.activities,
          ].slice(0, 40),
        })),

      sendReminder: (id, via) =>
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === id
              ? {
                  ...invoice,
                  reminders: [...invoice.reminders, { at: new Date().toISOString(), via }],
                }
              : invoice,
          ),
          activities: [
            {
              id: uid("act"),
              at: new Date().toISOString(),
              message: `Payment reminder sent via ${via}`,
              invoiceId: id,
            },
            ...state.activities,
          ].slice(0, 40),
        })),
    }),
    {
      name: "quotesnap-v2",
      skipHydration: true,
      partialize: (state) => {
        const { hydrated: _hydrated, ...rest } = state;
        void _hydrated;
        return rest;
      },
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;
        return {
          ...currentState,
          ...persisted,
          hydrated: currentState.hydrated,
          signedIn: persisted.signedIn ?? Boolean(persisted.session),
          business: normalizeBusiness(persisted.business),
        };
      },
    },
  ),
);
