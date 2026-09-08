"use client";

import { Button } from "@/components/Button";
import { CloudStatusCard } from "@/components/CloudStatusCard";
import { Field, Input, Select, Textarea } from "@/components/Field";
import { TRADE_LABELS } from "@/lib/ai";
import { gmailLinkStatus, googleClientId, linkGmail, saveGoogleClientId, unlinkGmail } from "@/lib/gmail";
import {
  registrationNumberHint,
  registrationNumberLabel,
  registrationNumberPlaceholder,
  taxNumberHint,
  taxNumberLabel,
  taxNumberPlaceholder,
} from "@/lib/money";
import { fileToLogo } from "@/lib/photos";
import { useStore } from "@/lib/store";
import type { Country, Trade } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SettingsPage() {
  const business = useStore((s) => s.business);
  const updateBusiness = useStore((s) => s.updateBusiness);
  const logout = useStore((s) => s.logout);
  const router = useRouter();
  const [gmail, setGmail] = useState(gmailLinkStatus);
  const [gmailBusy, setGmailBusy] = useState(false);
  const [gmailError, setGmailError] = useState("");
  const [clientId, setClientId] = useState(() => googleClientId(business.googleClientId));

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl tracking-tight">Business</h1>
      <CloudStatusCard />
      <div className="rounded-2xl border border-line bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-steel">Email</p>
        <p className="mt-1 font-semibold">
          {gmail.linked ? `Gmail linked as ${gmail.email}` : "Send readable HTML quotes from the app"}
        </p>
        <p className="mt-1 text-xs text-steel">
          Link Gmail so every contractor can tap Email and the customer receives the formatted quote
          with Accept and Decline. Replies come back to your Gmail. Copies stay in Mail.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {gmail.linked ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                unlinkGmail();
                setGmail({ linked: false, email: "" });
              }}
            >
              Unlink Gmail
            </Button>
          ) : (
            <Button
              type="button"
              disabled={gmailBusy}
              onClick={() => {
                setGmailError("");
                const id = clientId.trim();
                saveGoogleClientId(id);
                updateBusiness({ googleClientId: id });
                setGmailBusy(true);
                void linkGmail(id)
                  .then((result) => {
                    setGmail({ linked: true, email: result.email });
                  })
                  .catch(() => {
                    setGmailError(
                      id
                        ? "Could not link Gmail. Check the Google Client ID and that this site is an authorised origin."
                        : "Add a Google Client ID below, then tap Link Gmail.",
                    );
                  })
                  .finally(() => setGmailBusy(false));
              }}
            >
              {gmailBusy ? "Linking…" : "Link Gmail"}
            </Button>
          )}
          <Link href="/app/mail" className="inline-flex items-center text-sm font-semibold text-rust">
            Open Mail
          </Link>
        </div>
        {gmailError ? <p className="mt-2 text-xs text-red-700">{gmailError}</p> : null}
        {!gmail.linked ? (
          <Field
            label="Google Client ID"
            hint="From Google Cloud → OAuth web client. Authorised origin: this website. Enables send from your Gmail for every contractor on this job book."
          >
            <Input
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                saveGoogleClientId(e.target.value);
                updateBusiness({ googleClientId: e.target.value.trim() });
              }}
              placeholder="123-abc.apps.googleusercontent.com"
            />
          </Field>
        ) : null}
      </div>
      <p className="text-sm text-ink-soft">
        These details print on quotes and invoices, including GST for {business.country === "NZ" ? "New Zealand" : "Australia"}.
      </p>
      <Field label="Business name">
        <Input value={business.name} onChange={(e) => updateBusiness({ name: e.target.value })} />
      </Field>
      <div>
        <p className="mb-1.5 text-sm font-medium text-ink-soft">Company logo</p>
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-28 place-items-center overflow-hidden rounded-xl border border-line bg-card">
            {business.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logoDataUrl} alt="Company logo" className="max-h-14 max-w-[6.5rem] object-contain" />
            ) : (
              <span className="px-2 text-center text-[11px] text-steel">No logo yet</span>
            )}
          </div>
          <div className="space-y-2">
            <label className="inline-flex cursor-pointer rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold">
              Upload logo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  updateBusiness({ logoDataUrl: await fileToLogo(file) });
                  event.target.value = "";
                }}
              />
            </label>
            {business.logoDataUrl ? (
              <button
                type="button"
                className="block text-xs font-semibold text-rust"
                onClick={() => updateBusiness({ logoDataUrl: "" })}
              >
                Remove logo
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-1 text-xs text-steel">Shown on every quote and invoice you send.</p>
      </div>
      <Field label="Owner">
        <Input value={business.ownerName} onChange={(e) => updateBusiness({ ownerName: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email">
          <Input value={business.email} onChange={(e) => updateBusiness({ email: e.target.value })} />
        </Field>
        <Field label="Phone">
          <Input value={business.phone} onChange={(e) => updateBusiness({ phone: e.target.value })} />
        </Field>
      </div>
      <Field label="Business address">
        <Textarea value={business.address} onChange={(e) => updateBusiness({ address: e.target.value })} />
      </Field>
      <Field label={registrationNumberLabel(business.country)} hint={registrationNumberHint(business.country)}>
        <Input
          value={business.registrationNumber ?? ""}
          onChange={(e) => updateBusiness({ registrationNumber: e.target.value })}
          placeholder={registrationNumberPlaceholder(business.country)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Country">
          <Select
            value={business.country}
            onChange={(e) => updateBusiness({ country: e.target.value as Country })}
          >
            <option value="NZ">New Zealand</option>
            <option value="AU">Australia</option>
          </Select>
        </Field>
        <Field label="City">
          <Input value={business.city} onChange={(e) => updateBusiness({ city: e.target.value })} />
        </Field>
      </div>
      <Field label="Trade">
        <Select value={business.trade} onChange={(e) => updateBusiness({ trade: e.target.value as Trade })}>
          {Object.entries(TRADE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={business.gstRegistered}
          onChange={(e) => updateBusiness({ gstRegistered: e.target.checked })}
        />
        GST registered — add {business.country === "NZ" ? "15%" : "10%"} on quotes and invoices
      </label>
      <Field label={taxNumberLabel(business.country)} hint={taxNumberHint(business.country)}>
        <Input
          value={business.taxNumber}
          onChange={(e) => updateBusiness({ taxNumber: e.target.value })}
          placeholder={taxNumberPlaceholder(business.country)}
        />
      </Field>
      <Field label="Bank name">
        <Input value={business.bankName} onChange={(e) => updateBusiness({ bankName: e.target.value })} />
      </Field>
      <Field label="Account number" hint={business.country === "NZ" ? "XX-XXXX-XXXXXXX-XX" : "BSB + account"}>
        <Input value={business.bankAccount} onChange={(e) => updateBusiness({ bankAccount: e.target.value })} />
      </Field>
      <Field label="Payment terms (days)">
        <Input
          type="number"
          min={0}
          value={business.paymentTermsDays}
          onChange={(e) => updateBusiness({ paymentTermsDays: Number(e.target.value) })}
        />
      </Field>
      <div className="space-y-3 rounded-2xl border border-line bg-card p-4">
        <p className="font-display text-lg">Pay button</p>
        <p className="text-sm text-ink-soft">
          Send a one-click Pay button with every invoice. Customers choose Visa, Mastercard or bank transfer.
        </p>
        <Field
          label="Pay button link"
          hint="Paste your Stripe, Windcave, Flik or PayPal checkout URL. Leave blank to use QuoteSnap’s pay page plus bank transfer."
        >
          <Input
            value={business.payButtonUrl ?? ""}
            onChange={(e) => updateBusiness({ payButtonUrl: e.target.value })}
            placeholder="https://checkout.stripe.com/c/pay/..."
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={business.acceptVisa !== false}
            onChange={(e) => updateBusiness({ acceptVisa: e.target.checked })}
          />
          Visa
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={business.acceptMastercard !== false}
            onChange={(e) => updateBusiness({ acceptMastercard: e.target.checked })}
          />
          Mastercard
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={business.acceptBankTransfer !== false}
            onChange={(e) => updateBusiness({ acceptBankTransfer: e.target.checked })}
          />
          Bank transfer
        </label>
      </div>
      <Field label="CC emails" hint="Creator copies when you send a quote. Comma separated.">
        <Input
          value={business.ccEmails.join(", ")}
          onChange={(e) =>
            updateBusiness({
              ccEmails: e.target.value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
        />
      </Field>
      <Link href="/app/plan" className="block text-sm font-semibold text-rust">
        Current plan: {business.plan} — change plan
      </Link>
      <Button
        variant="secondary"
        onClick={() => {
          logout();
          router.push("/");
        }}
      >
        Log out
      </Button>
    </div>
  );
}
