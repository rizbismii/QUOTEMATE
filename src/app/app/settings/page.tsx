"use client";

import { Button } from "@/components/Button";
import { CloudStatusCard } from "@/components/CloudStatusCard";
import { Field, Input, Select, Textarea } from "@/components/Field";
import { TRADE_LABELS } from "@/lib/ai";
import { taxNumberLabel } from "@/lib/money";
import { useStore } from "@/lib/store";
import type { Country, Trade } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const business = useStore((s) => s.business);
  const updateBusiness = useStore((s) => s.updateBusiness);
  const logout = useStore((s) => s.logout);
  const router = useRouter();

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl tracking-tight">Business</h1>
      <CloudStatusCard />
      <p className="text-sm text-ink-soft">
        These details print on quotes and invoices, including GST for {business.country === "NZ" ? "New Zealand" : "Australia"}.
      </p>
      <Field label="Business name">
        <Input value={business.name} onChange={(e) => updateBusiness({ name: e.target.value })} />
      </Field>
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
      <Field label="Address">
        <Textarea value={business.address} onChange={(e) => updateBusiness({ address: e.target.value })} />
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
      <Field label={taxNumberLabel(business.country)}>
        <Input
          value={business.taxNumber}
          onChange={(e) => updateBusiness({ taxNumber: e.target.value })}
          placeholder={business.country === "NZ" ? "123-456-789" : "12 345 678 901"}
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
