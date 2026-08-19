"use client";

import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = useStore((s) => s.session);
  const hydrated = useStore((s) => s.hydrated);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !session) router.replace("/login");
  }, [hydrated, session, router]);

  if (!hydrated || !session) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper text-steel">
        Opening your job book…
      </div>
    );
  }

  return children;
}
