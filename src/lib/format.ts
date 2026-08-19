import type { Country } from "./types";

export function formatDate(iso: string, country: Country): string {
  if (!iso) return "";
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return date.toLocaleDateString(country === "NZ" ? "en-NZ" : "en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string, country: Country): string {
  const date = new Date(iso);
  return date.toLocaleString(country === "NZ" ? "en-NZ" : "en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function tradePossessive(label: string): string {
  return label.toLowerCase();
}

export function toE164(phone: string, country: Country): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return digits;
  if (country === "NZ") {
    if (digits.startsWith("64")) return digits;
    if (digits.startsWith("0")) return `64${digits.slice(1)}`;
    return `64${digits}`;
  }
  if (digits.startsWith("61")) return digits;
  if (digits.startsWith("0")) return `61${digits.slice(1)}`;
  return `61${digits}`;
}

export function displayPhone(phone: string): string {
  return phone.trim();
}
