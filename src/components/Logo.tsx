import { Camera } from "lucide-react";

export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div
      className={`grid place-items-center rounded-2xl bg-ink text-paper shadow-md ${className}`}
      aria-hidden
    >
      <Camera className="h-[55%] w-[55%]" strokeWidth={2.2} />
    </div>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo />
      <div>
        <p className={`font-display text-xl leading-none tracking-tight ${light ? "text-paper" : "text-ink"}`}>
          QuoteSnap
        </p>
        <p className={`text-[11px] font-medium uppercase tracking-[0.16em] ${light ? "text-paper/70" : "text-steel"}`}>
          NZ · AU tradies
        </p>
      </div>
    </div>
  );
}
