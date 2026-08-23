import { cardCheckoutUrl, payMethodLabel, payMethods } from "@/lib/pay";
import { publicPayPath } from "@/lib/paths";
import { publicUrl } from "@/lib/share";
import type { Business, Invoice } from "@/lib/types";
import { CreditCard, Landmark } from "lucide-react";

export function CardMarks({
  visa,
  mastercard,
}: {
  visa?: boolean;
  mastercard?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {visa ? (
        <span className="rounded bg-[#1a1f71] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
          VISA
        </span>
      ) : null}
      {mastercard ? (
        <span className="inline-flex items-center" aria-label="Mastercard">
          <span className="h-3.5 w-3.5 rounded-full bg-[#eb001b]" />
          <span className="-ml-2 h-3.5 w-3.5 rounded-full bg-[#f79e1b]" />
        </span>
      ) : null}
    </span>
  );
}

export function PayNowLink({
  business,
  invoice,
  className = "",
}: {
  business: Business;
  invoice: Invoice;
  className?: string;
}) {
  const href = publicUrl(publicPayPath(invoice.publicToken));
  return (
    <a
      href={href}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full bg-rust px-4 py-3 text-sm font-semibold text-white shadow-sm ${className}`}
    >
      <CreditCard className="h-4 w-4" />
      Pay now — {payMethodLabel(business)}
    </a>
  );
}

export function PayOptions({
  business,
  invoice,
  onPayCard,
  onPaidBank,
}: {
  business: Business;
  invoice: Invoice;
  onPayCard?: (href: string) => void;
  onPaidBank?: () => void;
}) {
  const methods = payMethods(business);
  const cardHref = cardCheckoutUrl(business, invoice);

  function openCard() {
    if (cardHref) {
      if (onPayCard) onPayCard(cardHref);
      else window.open(cardHref, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="space-y-3">
      {(methods.visa || methods.mastercard) && (
        <button
          type="button"
          onClick={openCard}
          disabled={!cardHref}
          className="flex w-full items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-left disabled:opacity-70"
        >
          <span>
            <span className="block text-sm font-semibold">Card — one click</span>
            <span className="text-xs text-steel">
              {cardHref
                ? "Opens your Pay button for Visa or Mastercard"
                : "Add a Pay button link in Settings to take cards"}
            </span>
          </span>
          <CardMarks visa={methods.visa} mastercard={methods.mastercard} />
        </button>
      )}
      {methods.bank ? (
        <div className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Landmark className="h-4 w-4" /> Bank transfer
          </p>
          <p className="mt-1 text-ink-soft">{business.bankName || "Add bank name in Settings"}</p>
          <p className="font-mono text-base">{business.bankAccount || "Add account number in Settings"}</p>
          <p className="mt-2 text-xs text-steel">Use {invoice.number} as the reference.</p>
          {onPaidBank ? (
            <button type="button" onClick={onPaidBank} className="mt-3 text-sm font-semibold text-rust">
              I’ve paid by transfer
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
