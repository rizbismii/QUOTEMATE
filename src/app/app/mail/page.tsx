"use client";

import { formatDateTime } from "@/lib/format";
import { invoiceViewPath, quoteViewPath } from "@/lib/paths";
import { useStore } from "@/lib/store";
import type { MailFolder } from "@/lib/types";
import { Inbox, Send } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function MailPage() {
  const mails = useStore((s) => s.mails ?? []);
  const business = useStore((s) => s.business);
  const [folder, setFolder] = useState<MailFolder>("inbox");
  const [openId, setOpenId] = useState<string | null>(null);

  const items = useMemo(
    () => mails.filter((item) => item.folder === folder),
    [folder, mails],
  );
  const open = items.find((item) => item.id === openId) ?? items[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Mail</h1>
        <p className="text-sm text-ink-soft">
          Quotes you send and replies from customers stay readable here for every contractor on the
          job book.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setFolder("inbox");
            setOpenId(null);
          }}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold ${
            folder === "inbox" ? "bg-ink text-paper" : "border border-line bg-card"
          }`}
        >
          <Inbox className="h-4 w-4" /> Inbox
        </button>
        <button
          type="button"
          onClick={() => {
            setFolder("sent");
            setOpenId(null);
          }}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold ${
            folder === "sent" ? "bg-ink text-paper" : "border border-line bg-card"
          }`}
        >
          <Send className="h-4 w-4" /> Sent
        </button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card p-4 text-sm text-steel">
          {folder === "inbox"
            ? "When a customer accepts or declines, it lands here so you can read it on any device."
            : "Send a quote by Email and the formatted copy is saved in Sent."}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(item.id)}
                  className={`w-full rounded-2xl border p-3 text-left ${
                    open?.id === item.id ? "border-rust bg-card" : "border-line bg-card"
                  }`}
                >
                  <p className="font-semibold">{item.subject}</p>
                  <p className="text-xs text-steel">
                    {folder === "inbox" ? item.from : item.to} ·{" "}
                    {formatDateTime(item.at, business.country)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
          {open ? (
            <article className="rounded-2xl border border-line bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-steel">
                {open.folder === "inbox" ? "From" : "To"}
              </p>
              <p className="font-semibold">{open.folder === "inbox" ? open.from : open.to}</p>
              <h2 className="mt-3 font-display text-2xl tracking-tight">{open.subject}</h2>
              {open.html ? (
                <iframe
                  title={open.subject}
                  className="mt-3 h-[420px] w-full rounded-xl border border-line bg-paper"
                  srcDoc={open.html}
                />
              ) : (
                <p className="mt-3 whitespace-pre-wrap text-sm text-ink-soft">{open.text}</p>
              )}
              {open.quoteId ? (
                <Link href={quoteViewPath(open.quoteId)} className="mt-3 inline-block text-sm font-semibold text-rust">
                  Open quote
                </Link>
              ) : null}
              {open.invoiceId ? (
                <Link href={invoiceViewPath(open.invoiceId)} className="mt-3 inline-block text-sm font-semibold text-rust">
                  Open invoice
                </Link>
              ) : null}
            </article>
          ) : null}
        </div>
      )}
      <Link href="/app/settings" className="block text-sm font-semibold text-rust">
        Link Gmail in Settings to send from your own address
      </Link>
    </div>
  );
}
