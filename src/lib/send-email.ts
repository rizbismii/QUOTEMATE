import { mailtoHref, openMailto } from "./share";

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fold76(value: string): string {
  return value.match(/.{1,76}/g)?.join("\r\n") ?? value;
}

function encodeSubject(subject: string): string {
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  return `=?UTF-8?B?${utf8ToBase64(subject)}?=`;
}

export function quoteEmailFileName(number: string): string {
  return `Quote-${number.replace(/[^\w.-]+/g, "")}.eml`;
}

export function buildQuoteEml(input: {
  from: string;
  to: string;
  cc?: string;
  subject: string;
  html: string;
  text: string;
}): string {
  const boundary = `quotesnap${Math.random().toString(36).slice(2, 10)}`;
  const lines = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    input.cc ? `Cc: ${input.cc}` : null,
    `Subject: ${encodeSubject(input.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    fold76(utf8ToBase64(input.text)),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    fold76(utf8ToBase64(input.html)),
    `--${boundary}--`,
    "",
  ].filter((line): line is string => line !== null);
  return lines.join("\r\n");
}

export async function copyRichText(html: string, text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      typeof ClipboardItem !== "undefined" &&
      navigator.clipboard?.write
    ) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      return true;
    }
  } catch {
    // Some mobile browsers reject text/html clipboard items.
  }

  if (typeof document !== "undefined") {
    try {
      const holder = document.createElement("div");
      holder.contentEditable = "true";
      holder.innerHTML = html;
      holder.style.position = "fixed";
      holder.style.left = "-9999px";
      document.body.appendChild(holder);
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(holder);
      selection?.removeAllRanges();
      selection?.addRange(range);
      const ok = document.execCommand("copy");
      selection?.removeAllRanges();
      holder.remove();
      if (ok) return true;
    } catch {
      // fall through
    }
  }

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function openQuoteEmail(input: {
  from: string;
  to: string;
  cc?: string;
  subject: string;
  html: string;
  text: string;
  fileName: string;
}): Promise<"shared" | "mailto"> {
  await copyRichText(input.html, input.text);

  const eml = buildQuoteEml(input);
  const file = new File([eml], input.fileName, { type: "message/rfc822" });
  try {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: input.subject,
        text: input.text,
      });
      return "shared";
    }
  } catch (error) {
    if ((error as { name?: string })?.name === "AbortError") return "shared";
  }

  openMailto(mailtoHref(input.to, input.subject, input.text, input.cc));
  return "mailto";
}
