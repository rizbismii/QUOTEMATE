"use client";

import { Button } from "@/components/Button";
import { Field, Input } from "@/components/Field";
import { Wordmark } from "@/components/Logo";
import { signInFromCloud } from "@/lib/cloud-auth";
import { emailsMatch } from "@/lib/auth";
import { DEMO_LOGIN } from "@/lib/demo";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useStore((s) => s.signIn);
  const loadDemo = useStore((s) => s.loadDemo);
  const session = useStore((s) => s.session);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const local = signIn(email, password);
    if (local.ok) {
      router.push("/app");
      return;
    }
    const localAccount = session && emailsMatch(session.email, email);
    if (local.reason === "password" && localAccount) {
      setError("Wrong password. Try again or reset it.");
      return;
    }
    setBusy(true);
    const cloud = await signInFromCloud(email, password);
    setBusy(false);
    if (cloud.ok) {
      router.push("/app");
      return;
    }
    if (cloud.reason === "password") {
      setError("Wrong password. Try again or reset it.");
      return;
    }
    if (local.reason === "email") {
      setError("That email does not match the account saved here. Check the address, or register.");
      return;
    }
    setError("No matching account yet. Register, or try the demo.");
  }

  return (
    <main className="grain mx-auto grid min-h-dvh max-w-md content-center px-4">
      <Wordmark />
      <h1 className="mt-8 font-display text-4xl tracking-tight">Log in</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Use the email and password from register. Quotes sync to the cloud, so phone and computer stay
        in step.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Email">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        <p className="text-sm">
          <Link href="/forgot-password" className="font-semibold text-rust">
            Forgot password?
          </Link>
        </p>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Checking…" : "Continue"}
        </Button>
      </form>
      <Button
        type="button"
        variant="secondary"
        className="mt-3 w-full"
        onClick={() => {
          loadDemo();
          router.push("/app");
        }}
      >
        Try demo ({DEMO_LOGIN.email})
      </Button>
      <p className="mt-6 text-sm text-steel">
        New business?{" "}
        <Link href="/register" className="font-semibold text-rust">
          Register
        </Link>
      </p>
    </main>
  );
}
