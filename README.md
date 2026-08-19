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

## Run it

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and tap **Try the live demo**.

Demo login: `sam@halefencing.co.nz` (any password). Demo business: Hale & Co. Fencing, Grey Lynn, Auckland, GST 15%, Business plan.

```bash
npm run build
npm start
```

## What is real vs demo

- Quotes, invoices, GST, plans, send templates and accountant CSV all run in the browser (local storage).
- AI descriptions are generated on-device from the voice note, trade, city and NZ/AU rate cards. Plug in a vision model later for true photo analysis.
- SMS / email / WhatsApp open the device share links (`mailto:`, `sms:`, `wa.me`) and CC the business emails on email.
- Customer accept/pay links work in the **same browser** as the tradie (the job book is local). A hosted API would make those links work on the customer’s phone.

## Stack

Next.js 15, React 19, Tailwind 4, Zustand, Vitest.

Built for phones first. Add to Home Screen from the manifest if you want it to feel like an app on site.
