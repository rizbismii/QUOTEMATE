# QuoteSnap

Photo → quote → invoice for New Zealand and Australian tradies.

QuoteSnap is a simple job book, not a second Xero. A plumber, electrician, builder, painter, landscaper, cleaner or handyman takes photos of the job, says what needs doing, and gets a GST-ready quote they can send by SMS, email or WhatsApp. When the customer accepts, one tap turns it into a tax invoice, with payment tracking and a CSV for the accountant.

## Why this exists

NZ and Australian small businesses are moving off Word invoices and spreadsheets. The painful loop is still:

Job done → type an invoice → email a PDF → guess who has paid → send a bundle to the accountant.

QuoteSnap is the front-end of that loop:

1. Take photos of the job
2. Say: “Replace 6 metres of fencing”
3. AI writes the job description and suggested labour / materials
4. Edit prices (GST 15% NZ / 10% AU, or none if you are not registered)
5. Send the quote; the creator emails are CC’d
6. Customer accepts on a link
7. Convert quote → tax invoice
8. Track paid / unpaid, send a reminder, export GST for the accountant

## Plans

| Plan | Price | Quotes | Invoices & payments |
| --- | --- | --- | --- |
| Free | $0 | 10 / month | — |
| Starter | $9.99 / mo | 30 / month | — |
| Pro | $19.99 / mo | Unlimited | — |
| Business | $29.99 / mo | Unlimited | AI photo notes, invoices, GST records, reminders, CSV export |

This repo is a working product demo. Plans can be switched in-app without taking a card.

## Test it live

**https://rizbismii.github.io/QUOTEMATE/**

Tap **Try the live demo**. Demo login: `sam@halefencing.co.nz` (any password).

## Run it locally

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and tap **Try the live demo**.

```bash
npm run build
npx serve out
```

## Supabase

QuoteSnap is linked to project `qpvufdxaapbvldpcustp` (`https://qpvufdxaapbvldpcustp.supabase.co`).

The browser uses the **publishable** key. Schema lives in `supabase/migrations`.

If the `workspaces` table is missing, run this in the [SQL editor](https://supabase.com/dashboard/project/qpvufdxaapbvldpcustp/sql/new), or from a machine that is logged in:

```bash
npx supabase login
npx supabase link --project-ref qpvufdxaapbvldpcustp
npx supabase db push
```

## Stack

Next.js 15, React 19, Tailwind 4, Zustand, Vitest.

Built for phones first. Add to Home Screen from the manifest if you want it to feel like an app on site.
