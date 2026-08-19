import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    primary:
      "bg-rust text-white shadow-sm hover:bg-rust-dark disabled:bg-rust/40",
    secondary:
      "bg-card text-ink border border-line hover:bg-paper disabled:opacity-50",
    ghost: "bg-transparent text-ink hover:bg-ink/5",
    danger: "bg-red-700 text-white hover:bg-red-800",
    dark: "bg-ink text-paper hover:bg-ink/90",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:pointer-events-none",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
