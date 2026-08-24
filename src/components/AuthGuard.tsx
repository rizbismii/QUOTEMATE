"use client";

import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const signedIn = useStore((s) => s.signedIn);
  const hydrated = useStore((s) => s.hydrated);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !signedIn) router.replace("/login");
  }, [hydrated, signedIn, router]);

  if (!hydrated || !signedIn) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper text-steel">
        Opening your job book…
      </div>
    );
  }

  return children;
}
