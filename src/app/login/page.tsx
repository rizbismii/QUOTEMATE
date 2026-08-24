"use client";

import { Button } from "@/components/Button";
import { Field, Input } from "@/components/Field";
import { Wordmark } from "@/components/Logo";
import { DEMO_LOGIN } from "@/lib/demo";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useStore((s) => s.signIn);
  const loadDemo = useStore((s) => s.loadDemo);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = signIn(email, password);
    if (result.ok) {
      router.push("/app");
      return;
    }
    if (result.reason === "missing") {
      setError("No account on this device yet. Register, or try the demo.");
      return;
    }
    if (result.reason === "email") {
      setError("That email does not match the account saved on this device.");
      return;
    }
    setError("Wrong password. Try again or reset it.");
  }

  return (
    <main className="grain mx-auto grid min-h-dvh max-w-md content-center px-4">
      <Wordmark />
      <h1 className="mt-8 font-display text-4xl tracking-tight">Log in</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Use the email and password you saved when you registered. This demo keeps your job book in
        this browser.
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
        <Button type="submit" className="w-full">
          Continue
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
