"use client";

import { Button } from "@/components/Button";
import { Field, Input, Select, Textarea } from "@/components/Field";
import { Wordmark } from "@/components/Logo";
import { TRADE_LABELS } from "@/lib/ai";
import { passwordIsValid } from "@/lib/auth";
import {
  registrationNumberHint,
  registrationNumberLabel,
  registrationNumberPlaceholder,
  taxNumberHint,
  taxNumberLabel,
  taxNumberPlaceholder,
} from "@/lib/money";
import { useStore } from "@/lib/store";
import { snapshotFromState, pushWorkspace, workspaceIdForEmail } from "@/lib/supabase-sync";
import type { Country, Trade } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const register = useStore((s) => s.register);
  const [trade, setTrade] = useState<Trade>("plumber");
  const [country, setCountry] = useState<Country>("NZ");
  const [gstRegistered, setGstRegistered] = useState(true);
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    const confirm = String(data.get("confirmPassword"));
    if (!passwordIsValid(password)) {
      setError("Choose a password with at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const result = register({
      ownerName: String(data.get("ownerName")),
      email: String(data.get("email")),
      password,
      businessName: String(data.get("businessName")),
      phone: String(data.get("phone")),
      city: String(data.get("city")),
      address: String(data.get("address") ?? ""),
      registrationNumber: String(data.get("registrationNumber") ?? ""),
      taxNumber: String(data.get("taxNumber") ?? ""),
      gstRegistered,
      trade,
      country,
    });
    if (!result.ok) {
      setError("Choose a password with at least 6 characters.");
      return;
    }
    const state = useStore.getState();
    if (state.session?.email) {
      void pushWorkspace(snapshotFromState(state), workspaceIdForEmail(state.session.email));
    }
    router.push("/app");
  }

  return (
    <main className="grain mx-auto min-h-dvh max-w-md px-4 py-10">
      <Wordmark />
      <h1 className="mt-8 font-display text-4xl tracking-tight">Register your trade</h1>
      <p className="mt-2 text-sm text-ink-soft">
        GST, currency and quote language follow {country === "NZ" ? "New Zealand" : "Australia"}. Save
        your password so you can log back in on any phone.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Your name">
          <Input name="ownerName" required placeholder="Sam Hale" autoComplete="name" />
        </Field>
        <Field label="Business name">
          <Input name="businessName" required placeholder="Hale & Co. Fencing" autoComplete="organization" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Password" hint="At least 6 characters.">
          <Input name="password" type="password" required autoComplete="new-password" minLength={6} />
        </Field>
        <Field label="Confirm password">
          <Input name="confirmPassword" type="password" required autoComplete="new-password" minLength={6} />
        </Field>
        <Field label="Mobile">
          <Input
            name="phone"
            required
            placeholder={country === "NZ" ? "021 555 0148" : "0412 555 148"}
            autoComplete="tel"
          />
        </Field>
        <Field label="Business address" hint="Printed on quotes and invoices.">
          <Textarea
            name="address"
            placeholder={
              country === "NZ"
                ? "12 Richmond Road, Grey Lynn, Auckland 1021"
                : "44 Smith Street, Collingwood VIC 3066"
            }
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Country">
            <Select value={country} onChange={(e) => setCountry(e.target.value as Country)}>
              <option value="NZ">New Zealand</option>
              <option value="AU">Australia</option>
            </Select>
          </Field>
          <Field label="City">
            <Input name="city" required placeholder={country === "NZ" ? "Auckland" : "Melbourne"} />
          </Field>
        </div>
        <Field label="Trade">
          <Select value={trade} onChange={(e) => setTrade(e.target.value as Trade)}>
            {Object.entries(TRADE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={registrationNumberLabel(country)} hint={registrationNumberHint(country)}>
          <Input name="registrationNumber" placeholder={registrationNumberPlaceholder(country)} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={gstRegistered}
            onChange={(e) => setGstRegistered(e.target.checked)}
          />
          GST registered — add {country === "NZ" ? "15%" : "10%"} on quotes and invoices
        </label>
        <Field label={taxNumberLabel(country)} hint={taxNumberHint(country)}>
          <Input
            name="taxNumber"
            placeholder={taxNumberPlaceholder(country)}
            disabled={!gstRegistered}
          />
        </Field>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" className="w-full">
          Create free account
        </Button>
      </form>
      <p className="mt-6 text-sm text-steel">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-rust">
          Log in
        </Link>
        {" · "}
        <Link href="/forgot-password" className="font-semibold text-rust">
          Forgot password
        </Link>
      </p>
    </main>
  );
}
