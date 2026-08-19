"use client";

import { Button } from "@/components/Button";
import { Field, Input, Select } from "@/components/Field";
import { Wordmark } from "@/components/Logo";
import { TRADE_LABELS } from "@/lib/ai";
import { useStore } from "@/lib/store";
import type { Country, Trade } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const register = useStore((s) => s.register);
  const [trade, setTrade] = useState<Trade>("plumber");
  const [country, setCountry] = useState<Country>("NZ");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    register({
      ownerName: String(data.get("ownerName")),
      email: String(data.get("email")),
      businessName: String(data.get("businessName")),
      phone: String(data.get("phone")),
      city: String(data.get("city")),
      trade,
      country,
    });
    router.push("/app");
  }

  return (
    <main className="grain mx-auto min-h-dvh max-w-md px-4 py-10">
      <Wordmark />
      <h1 className="mt-8 font-display text-4xl tracking-tight">Register your trade</h1>
      <p className="mt-2 text-sm text-ink-soft">
        GST, currency and quote language follow NZ or Australia. You can add your GST/ABN in settings.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Your name">
          <Input name="ownerName" required placeholder="Sam Hale" />
        </Field>
        <Field label="Business name">
          <Input name="businessName" required placeholder="Hale & Co. Fencing" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required />
        </Field>
        <Field label="Mobile">
          <Input name="phone" required placeholder="021 555 0148" />
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
        <Button type="submit" className="w-full">
          Create free account
        </Button>
      </form>
      <p className="mt-6 text-sm text-steel">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-rust">
          Log in
        </Link>
      </p>
    </main>
  );
}
