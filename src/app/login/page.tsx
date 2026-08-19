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
  const session = useStore((s) => s.session);
  const login = useStore((s) => s.login);
  const loadDemo = useStore((s) => s.loadDemo);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (session && session.email.toLowerCase() === email.toLowerCase()) {
      router.push("/app");
      return;
    }
    if (email.toLowerCase() === DEMO_LOGIN.email) {
      loadDemo();
      router.push("/app");
      return;
    }
    if (!session) {
      setError("No account on this device yet. Register, or try the demo.");
      return;
    }
    login(session);
    router.push("/app");
  }

  return (
    <main className="grain mx-auto grid min-h-dvh max-w-md content-center px-4">
      <Wordmark />
      <h1 className="mt-8 font-display text-4xl tracking-tight">Log in</h1>
      <p className="mt-2 text-sm text-ink-soft">
        This demo keeps your job book in this browser. Use the same device you registered on.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Email">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" hint="Any password works on this device demo.">
          <Input type="password" required defaultValue="" />
        </Field>
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
        Try demo (sam@halefencing.co.nz)
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
