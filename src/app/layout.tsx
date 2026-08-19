import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { StoreProvider } from "@/components/StoreProvider";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuoteSnap — Photo to quote for NZ & AU tradies",
  description:
    "Take photos of the job, say the work, and QuoteSnap writes a GST-ready quote. Convert to invoice, track payment, export for your accountant. Built for New Zealand and Australia.",
  applicationName: "QuoteSnap",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#f1eadc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NZ">
      <body className={`${figtree.variable} ${bricolage.variable} font-sans antialiased`}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
