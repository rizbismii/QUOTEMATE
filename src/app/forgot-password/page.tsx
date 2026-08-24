"use client";

import { Button } from "@/components/Button";
import { Field, Input } from "@/components/Field";
import { Wordmark } from "@/components/Logo";
import { passwordIsValid } from "@/lib/auth";
import { resetPasswordAnywhere } from "@/lib/cloud-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const mobile = String(data.get("mobile"));
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
    setBusy(true);
    const result = await resetPasswordAnywhere({ email, mobile, password });
    setBusy(false);
    if (result.ok) {
      setDone(true);
      window.setTimeout(() => router.push("/login"), 1200);
      return;
    }
    if (result.reason === "mobile") {
      setError("Mobile number does not match the one saved on this account.");
      return;
    }
    setError("Choose a password with at least 6 characters.");
  }

  return (
    <main className="grain mx-auto min-h-dvh max-w-md px-4 py-10">
      <Wordmark />
      <h1 className="mt-8 font-display text-4xl tracking-tight">Forgot password</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Enter the email and mobile from register, then choose a new password. This works on any
        phone or browser.
      </p>
      {done ? (
        <p className="mt-6 text-sm font-semibold text-ink">Password updated. Taking you to log in…</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Email">
            <Input name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="Mobile" hint="Full number or last 4 digits from when you registered.">
            <Input name="mobile" required autoComplete="tel" placeholder="021 555 0148" />
          </Field>
          <Field label="New password" hint="At least 6 characters.">
            <Input name="password" type="password" required autoComplete="new-password" minLength={6} />
          </Field>
          <Field label="Confirm new password">
            <Input name="confirmPassword" type="password" required autoComplete="new-password" minLength={6} />
          </Field>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Checking…" : "Reset password"}
          </Button>
        </form>
      )}
      <p className="mt-6 text-sm text-steel">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-rust">
          Log in
        </Link>
        {" · "}
        <Link href="/register" className="font-semibold text-rust">
          Register
        </Link>
      </p>
    </main>
  );
}
