import type { Business } from "@/lib/types";
import { Wordmark } from "./Logo";

export function BusinessBrand({
  business,
  fallback = "wordmark",
}: {
  business: Business;
  fallback?: "wordmark" | "name";
}) {
  if (business.logoDataUrl) {
    return (
      <div className="max-w-[200px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={business.logoDataUrl}
          alt={business.name || "Company logo"}
          className="max-h-16 w-auto max-w-full object-contain"
        />
      </div>
    );
  }
  if (fallback === "name" && business.name) {
    return (
      <div>
        <p className="font-display text-xl leading-none tracking-tight">{business.name}</p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-steel">
          {business.city || (business.country === "NZ" ? "New Zealand" : "Australia")}
        </p>
      </div>
    );
  }
  return <Wordmark />;
}
