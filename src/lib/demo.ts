import { addDays, todayIso } from "./money";
import { invoiceNumber, quoteNumber } from "./ids";
import type { AppState, Business, Customer, Invoice, Quote } from "./types";

export const emptyBusiness = (): Business => ({
  name: "",
  ownerName: "",
  email: "",
  phone: "",
  trade: "handyman",
  country: "NZ",
  city: "",
  region: "",
  address: "",
  gstRegistered: true,
  taxNumber: "",
  bankName: "",
  bankAccount: "",
  paymentTermsDays: 7,
  ccEmails: [],
  plan: "free",
  logoDataUrl: "",
  payButtonUrl: "",
  acceptVisa: true,
  acceptMastercard: true,
  acceptBankTransfer: true,
});

export function normalizeBusiness(input?: Partial<Business> | null): Business {
  return { ...emptyBusiness(), ...input };
}

const haleLogo =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80">
    <rect fill="#3a2a16" width="240" height="80" rx="12"/>
    <rect fill="#d9b36a" x="16" y="18" width="8" height="44"/>
    <rect fill="#c48a3a" x="28" y="22" width="8" height="40"/>
    <rect fill="#d9b36a" x="40" y="16" width="8" height="46"/>
    <text x="62" y="36" fill="#f4efe4" font-family="Arial, sans-serif" font-size="18" font-weight="700">HALE &amp; CO.</text>
    <text x="62" y="56" fill="#d9b36a" font-family="Arial, sans-serif" font-size="11" letter-spacing="2">FENCING</text>
  </svg>`);

const demoPhotos = {
  fence: {
    id: "ph_fence",
    name: "fence-line.jpg",
    dataUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">
      <rect fill="#c8b48a" width="800" height="560"/>
      <rect fill="#7d9b6a" y="340" width="800" height="220"/>
      <rect fill="#5c6e48" y="340" width="800" height="18"/>
      <rect fill="#8a6a3d" x="40" y="120" width="18" height="230"/>
      <rect fill="#8a6a3d" x="210" y="90" width="18" height="260"/>
      <rect fill="#8a6a3d" x="380" y="110" width="18" height="240"/>
      <rect fill="#8a6a3d" x="550" y="80" width="18" height="270"/>
      <rect fill="#8a6a3d" x="720" y="130" width="18" height="220"/>
      <g fill="#d9b36a">
        ${Array.from({ length: 28 }, (_, i) => `<rect x="${50 + i * 26}" y="150" width="16" height="${170 + (i % 3) * 12}" rx="2"/>`).join("")}
      </g>
      <rect fill="#6b4f28" x="40" y="318" width="720" height="12"/>
      <text x="40" y="520" fill="#3a2a16" font-family="Arial" font-size="22">Site photo · paling fence, ~6m section</text>
    </svg>`),
  },
  deck: {
    id: "ph_deck",
    name: "deck.jpg",
    dataUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">
      <rect fill="#87a7c2" width="800" height="560"/>
      <rect fill="#c9783c" y="220" width="800" height="340"/>
      ${Array.from({ length: 14 }, (_, i) => `<rect fill="${i % 2 ? "#b56830" : "#d08948"}" y="${230 + i * 22}" width="800" height="18"/>`).join("")}
      <rect fill="#6d4c2b" x="60" y="80" width="18" height="180"/>
      <rect fill="#6d4c2b" x="720" y="80" width="18" height="180"/>
      <rect fill="#eee3c8" x="60" y="70" width="678" height="16"/>
      <text x="40" y="520" fill="#3a2a16" font-family="Arial" font-size="22">Site photo · timber deck before stain</text>
    </svg>`),
  },
  hedge: {
    id: "ph_hedge",
    name: "garden.jpg",
    dataUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">
      <rect fill="#b7d3ef" width="800" height="560"/>
      <rect fill="#6d8f4e" y="300" width="800" height="260"/>
      <ellipse cx="160" cy="280" rx="140" ry="90" fill="#2f6b3a"/>
      <ellipse cx="400" cy="250" rx="180" ry="120" fill="#348046"/>
      <ellipse cx="650" cy="290" rx="150" ry="100" fill="#2a5d34"/>
      <rect fill="#cfc1a4" x="500" y="340" width="220" height="90"/>
      <text x="40" y="520" fill="#1d331f" font-family="Arial" font-size="22">Site photo · overgrown hedge & garden</text>
    </svg>`),
  },
};

export function demoState(): AppState {
  const today = todayIso();
  const customers: Customer[] = [
    {
      id: "cus_priya",
      name: "Priya Sharma",
      email: "priya.sharma@example.com",
      phone: "021 333 8899",
      address: "14 Tutanekai Street",
      suburb: "Grey Lynn",
      city: "Auckland",
    },
    {
      id: "cus_mark",
      name: "Mark Chen",
      email: "mark.chen@example.com",
      phone: "027 441 2201",
      address: "88 Jervois Road",
      suburb: "Herne Bay",
      city: "Auckland",
    },
    {
      id: "cus_wilson",
      name: "Amy Wilson",
      email: "amy.wilson@example.com",
      phone: "022 918 4402",
      address: "3 Marine Parade",
      suburb: "Ponsonby",
      city: "Auckland",
    },
  ];

  const quotes: Quote[] = [
    {
      id: "quo_fence",
      number: quoteNumber(1),
      publicToken: "fence6m",
      customerId: "cus_priya",
      jobAddress: "14 Tutanekai Street, Grey Lynn",
      city: "Auckland",
      photos: [demoPhotos.fence],
      voiceNote: "Replace 6 metres of fencing",
      title: "Replace 6 metres of fencing",
      description:
        "Supply and install approximately 6 metres of timber paling fencing at 14 Tutanekai Street, Grey Lynn, Auckland, including posts, rails, palings and hardware. Existing damaged section to be removed and the work area left tidy. Fence line and height to match neighbouring / existing fencing unless otherwise agreed.\n\nQuote is valid for 30 days. Workmanship guaranteed. Prices in NZD.",
      photoNotes:
        "AI reviewed 1 site photo and the voice note. Visible work matches “Replace 6 metres of fencing”. Quantities are estimates from what can be seen — confirm on site before ordering materials.",
      lineItems: [
        { id: "li1", kind: "labour", description: "Labour – remove existing and install new fencing", quantity: 4, unit: "hour", unitPrice: 70 },
        { id: "li2", kind: "materials", description: "Timber palings, rails and capping", quantity: 6, unit: "m", unitPrice: 48 },
        { id: "li3", kind: "materials", description: "Posts, concrete and hardware", quantity: 3, unit: "each", unitPrice: 38 },
        { id: "li4", kind: "other", description: "Rubbish removal and site tidy", quantity: 1, unit: "lot", unitPrice: 120 },
      ],
      notes: "Access via the side gate. Colour to match existing resene wood stain if possible.",
      validUntil: addDays(today, 30),
      status: "draft",
      sentVia: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "quo_deck",
      number: quoteNumber(2),
      publicToken: "deckstain",
      customerId: "cus_mark",
      jobAddress: "88 Jervois Road, Herne Bay",
      city: "Auckland",
      photos: [demoPhotos.deck],
      voiceNote: "Wash and stain the timber deck, two coats",
      title: "Wash and stain timber deck",
      description:
        "Wash down, prepare and apply two coats of exterior timber stain to the deck at 88 Jervois Road, Herne Bay, Auckland. Includes sanding of rough edges, gap filling where required, and protection of adjacent surfaces.\n\nQuote is valid for 30 days. Workmanship guaranteed. Prices in NZD.",
      photoNotes: "AI reviewed 1 site photo and the voice note. Visible work matches “Wash and stain the timber deck, two coats”.",
      lineItems: [
        { id: "li5", kind: "labour", description: "Labour – preparation and painting", quantity: 8, unit: "hour", unitPrice: 70 },
        { id: "li6", kind: "materials", description: "Exterior timber stain and consumables", quantity: 1, unit: "lot", unitPrice: 180 },
      ],
      notes: "",
      validUntil: addDays(today, 21),
      status: "invoiced",
      sentAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      sentVia: ["email", "sms"],
      acceptedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "quo_hedge",
      number: quoteNumber(3),
      publicToken: "hedgecut",
      customerId: "cus_wilson",
      jobAddress: "3 Marine Parade, Ponsonby",
      city: "Auckland",
      photos: [demoPhotos.hedge],
      voiceNote: "Trim the hedge and garden tidy, green waste away",
      title: "Trim the hedge and garden tidy, green waste away",
      description:
        "Landscaping / outdoor work at 3 Marine Parade, Ponsonby, Auckland: Trim the hedge and garden tidy, green waste away. Includes site protection, completion as scoped, and removal of green waste generated by this job.\n\nQuote is valid for 30 days. Workmanship guaranteed. Prices in NZD.",
      photoNotes: "AI reviewed 1 site photo and the voice note.",
      lineItems: [
        { id: "li7", kind: "labour", description: "Labour – landscaping", quantity: 6, unit: "hour", unitPrice: 70 },
        { id: "li8", kind: "materials", description: "Plants, soil, timber or hardware as scoped", quantity: 1, unit: "lot", unitPrice: 80 },
        { id: "li9", kind: "other", description: "Green waste removal", quantity: 1, unit: "lot", unitPrice: 90 },
      ],
      notes: "",
      validUntil: addDays(today, 30),
      status: "sent",
      sentAt: new Date(Date.now() - 86400000).toISOString(),
      sentVia: ["whatsapp"],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const invoices: Invoice[] = [
    {
      id: "inv_deck",
      number: invoiceNumber(1),
      quoteId: "quo_deck",
      publicToken: "invdeck",
      customerId: "cus_mark",
      jobAddress: "88 Jervois Road, Herne Bay",
      title: "Wash and stain timber deck",
      description: quotes[1].description,
      lineItems: quotes[1].lineItems,
      photos: [demoPhotos.deck],
      notes: "Please use the bank details on this invoice. Quote QS-0002.",
      issuedAt: addDays(today, -3),
      dueAt: addDays(today, 4),
      status: "unpaid",
      reminders: [],
    },
    {
      id: "inv_old",
      number: invoiceNumber(2),
      quoteId: "quo_old",
      publicToken: "invold",
      customerId: "cus_priya",
      jobAddress: "14 Tutanekai Street, Grey Lynn",
      title: "Repair side gate and latch",
      description: "Repair and realign side gate, replace latch hardware.",
      lineItems: [
        { id: "li10", kind: "labour", description: "Labour – gate repair", quantity: 2, unit: "hour", unitPrice: 70 },
        { id: "li11", kind: "materials", description: "Latch, hinges and fixings", quantity: 1, unit: "lot", unitPrice: 46 },
      ],
      photos: [],
      notes: "",
      issuedAt: addDays(today, -20),
      dueAt: addDays(today, -13),
      status: "paid",
      paidAt: addDays(today, -12),
      reminders: [],
    },
  ];

  return {
    hydrated: true,
    session: {
      email: "sam@halefencing.co.nz",
      name: "Sam Hale",
    },
    business: {
      name: "Hale & Co. Fencing",
      ownerName: "Sam Hale",
      email: "sam@halefencing.co.nz",
      phone: "021 555 0148",
      trade: "landscaper",
      country: "NZ",
      city: "Auckland",
      region: "Auckland",
      address: "12 Richmond Road, Grey Lynn, Auckland 1021",
      gstRegistered: true,
      taxNumber: "123-456-789",
      bankName: "Kiwibank",
      bankAccount: "38-9012-0054321-00",
      paymentTermsDays: 7,
      ccEmails: ["office@halefencing.co.nz"],
      plan: "business",
      logoDataUrl: haleLogo,
      payButtonUrl: "",
      acceptVisa: true,
      acceptMastercard: true,
      acceptBankTransfer: true,
    },
    customers,
    quotes,
    invoices,
    activities: [
      {
        id: "act1",
        at: new Date(Date.now() - 3600000).toISOString(),
        message: "Quote QS-0003 sent to Amy Wilson via WhatsApp",
        quoteId: "quo_hedge",
      },
      {
        id: "act2",
        at: new Date(Date.now() - 86400000 * 3).toISOString(),
        message: "Mark Chen accepted QS-0002 — converted to INV-0001",
        quoteId: "quo_deck",
        invoiceId: "inv_deck",
      },
      {
        id: "act3",
        at: new Date(Date.now() - 86400000 * 12).toISOString(),
        message: "Priya Sharma paid INV-0002",
        invoiceId: "inv_old",
      },
    ],
    quoteSeq: 3,
    invoiceSeq: 2,
  };
}

export const DEMO_LOGIN = {
  email: "sam@halefencing.co.nz",
  password: "demo",
};
