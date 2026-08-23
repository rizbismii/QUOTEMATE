"use client";

import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { FileText, Home, Plus, Receipt, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Logo";

const tabsLeft = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/quotes", label: "Quotes", icon: FileText },
];
const tabsRight = [
  { href: "/app/invoices", label: "Invoices", icon: Receipt },
  { href: "/app/records", label: "Records", icon: Wallet },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const business = useStore((s) => s.business);

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/app">
            <Wordmark />
          </Link>
          <Link
            href="/app/settings"
            className="flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold"
          >
            {business.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logoDataUrl} alt="" className="h-5 w-5 rounded object-contain" />
            ) : null}
            {business.country} · {business.plan}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-5 px-2 py-2">
          {tabsLeft.map((tab) => {
            const active = pathname === tab.href || (tab.href !== "/app" && pathname.startsWith(tab.href));
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] font-semibold",
                  active ? "text-rust" : "text-steel",
                )}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
          <Link href="/app/quotes/new" className="-mt-5 flex flex-col items-center text-[11px] font-semibold text-rust">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-rust text-paper shadow-lg">
              <Plus className="h-6 w-6" />
            </span>
            Snap
          </Link>
          {tabsRight.map((tab) => {
            const active = pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] font-semibold",
                  active ? "text-rust" : "text-steel",
                )}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
