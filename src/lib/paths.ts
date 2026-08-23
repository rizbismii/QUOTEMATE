const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBase(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}

export function quoteViewPath(id: string): string {
  return `/app/quotes/view/?id=${encodeURIComponent(id)}`;
}

export function invoiceViewPath(id: string): string {
  return `/app/invoices/view/?id=${encodeURIComponent(id)}`;
}

export function publicQuotePath(token: string): string {
  return `/q/?t=${encodeURIComponent(token)}`;
}

export function publicInvoicePath(token: string): string {
  return `/i/?t=${encodeURIComponent(token)}`;
}

export function publicPayPath(token: string): string {
  return `/pay/?t=${encodeURIComponent(token)}`;
}
