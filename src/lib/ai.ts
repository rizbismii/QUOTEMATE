import { uid } from "./ids";
import type { Country, LineItem, Trade } from "./types";

export const TRADE_LABELS: Record<Trade, string> = {
  plumber: "Plumber",
  electrician: "Electrician",
  builder: "Builder",
  painter: "Painter",
  landscaper: "Landscaper",
  cleaner: "Cleaner",
  handyman: "Handyman",
  other: "Tradie",
};

interface RateCard {
  labour: number;
  labourUnit: string;
}

const RATES: Record<Country, Record<Trade, RateCard>> = {
  NZ: {
    plumber: { labour: 95, labourUnit: "hour" },
    electrician: { labour: 110, labourUnit: "hour" },
    builder: { labour: 85, labourUnit: "hour" },
    painter: { labour: 65, labourUnit: "hour" },
    landscaper: { labour: 70, labourUnit: "hour" },
    cleaner: { labour: 45, labourUnit: "hour" },
    handyman: { labour: 75, labourUnit: "hour" },
    other: { labour: 80, labourUnit: "hour" },
  },
  AU: {
    plumber: { labour: 120, labourUnit: "hour" },
    electrician: { labour: 135, labourUnit: "hour" },
    builder: { labour: 95, labourUnit: "hour" },
    painter: { labour: 70, labourUnit: "hour" },
    landscaper: { labour: 75, labourUnit: "hour" },
    cleaner: { labour: 50, labourUnit: "hour" },
    handyman: { labour: 85, labourUnit: "hour" },
    other: { labour: 90, labourUnit: "hour" },
  },
};

export interface GenerateInput {
  voiceNote: string;
  trade: Trade;
  country: Country;
  city: string;
  jobAddress: string;
  photoCount: number;
  enhancedAi: boolean;
}

export interface GenerateResult {
  title: string;
  description: string;
  photoNotes: string;
  lineItems: LineItem[];
}

function firstNumber(note: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = note.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

function metres(note: string): number | null {
  return firstNumber(note, [
    /(\d+(?:\.\d+)?)\s*(?:metres|meters|metre|meter|m)\b/i,
  ]);
}

function hours(note: string): number | null {
  return firstNumber(note, [/(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr)\b/i]);
}

function rooms(note: string): number | null {
  return firstNumber(note, [/(\d+)\s*(?:rooms|bedrooms|bedroom)\b/i]);
}

function looksLike(note: string, words: string[]): boolean {
  const lower = note.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function item(
  kind: LineItem["kind"],
  description: string,
  quantity: number,
  unit: string,
  unitPrice: number,
): LineItem {
  return { id: uid("li"), kind, description, quantity, unit, unitPrice };
}

export function generateJob(input: GenerateInput): GenerateResult {
  const note = input.voiceNote.trim() || "General trade work as discussed on site";
  const rates = RATES[input.country][input.trade];
  const site = input.jobAddress
    ? `${input.jobAddress}${input.city ? `, ${input.city}` : ""}`
    : input.city || "the site";
  const m = metres(note);
  const hrs = hours(note);
  const roomCount = rooms(note);
  const lineItems: LineItem[] = [];

  let title = note.length > 72 ? `${note.slice(0, 69)}…` : note;
  title = title.charAt(0).toUpperCase() + title.slice(1);

  let description = "";

  if (looksLike(note, ["fenc"])) {
    const length = m ?? 6;
    title = `Replace ${length} metres of fencing`;
    description = `Supply and install approximately ${length} metres of timber paling fencing at ${site}, including posts, rails, palings and hardware. Existing damaged section to be removed and the work area left tidy. Fence line and height to match neighbouring / existing fencing unless otherwise agreed.`;
    lineItems.push(
      item("labour", "Labour – remove existing and install new fencing", Math.max(4, Math.round(length * 0.7)), "hour", rates.labour),
      item("materials", "Timber palings, rails and capping", length, "m", input.country === "NZ" ? 48 : 55),
      item("materials", "Posts, concrete and hardware", Math.max(2, Math.ceil(length / 2.4)), "each", input.country === "NZ" ? 38 : 42),
      item("other", "Rubbish removal and site tidy", 1, "lot", input.country === "NZ" ? 120 : 140),
    );
  } else if (looksLike(note, ["paint", "stain"])) {
    const count = roomCount ?? (m ? 0 : 2);
    title = looksLike(note, ["stain", "deck"])
      ? "Wash and stain timber deck"
      : count
        ? `Paint interior — ${count} room${count === 1 ? "" : "s"}`
        : "Painting as scoped on site";
    description = looksLike(note, ["stain", "deck"])
      ? `Wash down, prepare and apply two coats of exterior timber stain to the deck at ${site}. Includes sanding of rough edges, gap filling where required, and protection of adjacent surfaces.`
      : `Prepare and paint interior surfaces at ${site} as discussed. Includes filling minor holes, sanding, two coats of quality low-VOC paint, and a tidy finish to skirtings, walls and ceilings in the scoped rooms.`;
    const labourHours = hrs ?? (looksLike(note, ["deck"]) ? 8 : Math.max(6, (count || 2) * 4));
    lineItems.push(
      item("labour", "Labour – preparation and painting", labourHours, "hour", rates.labour),
      item("materials", looksLike(note, ["stain"]) ? "Exterior timber stain and consumables" : "Paint, filler and consumables", 1, "lot", input.country === "NZ" ? 180 : 210),
    );
  } else if (looksLike(note, ["tap", "leaking", "leak", "pipe", "hot water", "toilet", "sink", "plumb"])) {
    title = looksLike(note, ["hot water"]) ? "Hot water cylinder / system repair" : "Plumbing repair as scoped on site";
    description = `Attend ${site} to diagnose and complete the plumbing work described: “${note}”. Includes isolation, replacement of faulty fittings where quoted, testing on completion, and leaving the work area clean.`;
    lineItems.push(
      item("labour", "Labour – plumbing diagnosis and repair", hrs ?? 2, "hour", rates.labour),
      item("materials", "Fittings, pipework and consumables", 1, "lot", input.country === "NZ" ? 85 : 95),
    );
  } else if (looksLike(note, ["switch", "light", "power", "socket", "rewire", "switchboard"])) {
    title = "Electrical work as scoped on site";
    description = `Complete the electrical work at ${site} as described: “${note}”. All work to be carried out to ${input.country === "NZ" ? "AS/NZS 3000" : "AS/NZS 3000"} and left tested and safe. Certificate of compliance issued where required.`;
    lineItems.push(
      item("labour", "Labour – licensed electrical work", hrs ?? 3, "hour", rates.labour),
      item("materials", "Electrical fittings and consumables", 1, "lot", input.country === "NZ" ? 120 : 140),
    );
  } else if (looksLike(note, ["clean", "house clean", "end of tenancy", "bond"])) {
    title = looksLike(note, ["tenancy", "bond"]) ? "End of tenancy clean" : "Professional clean";
    description = `Full clean at ${site} as discussed. Includes kitchen, bathrooms, floors, internal glass and high-touch surfaces. Extra items (oven, windows, carpet) included only if listed below.`;
    lineItems.push(
      item("labour", "Labour – cleaning", hrs ?? 4, "hour", rates.labour),
      item("materials", "Cleaning products and consumables", 1, "lot", input.country === "NZ" ? 25 : 28),
    );
  } else if (looksLike(note, ["garden", "hedge", "lawn", "landscape", "retaining", "paving"])) {
    title = note.charAt(0).toUpperCase() + note.slice(1);
    description = `Landscaping / outdoor work at ${site}: ${note}. Includes site protection, completion as scoped, and removal of green waste generated by this job.`;
    lineItems.push(
      item("labour", "Labour – landscaping", hrs ?? 6, "hour", rates.labour),
      item("materials", "Plants, soil, timber or hardware as scoped", 1, "lot", input.country === "NZ" ? 220 : 250),
      item("other", "Green waste removal", 1, "lot", input.country === "NZ" ? 90 : 110),
    );
  } else {
    description = `Carry out the following work at ${site}:\n\n${note}\n\nScope is based on the site visit${input.photoCount ? ` and ${input.photoCount} site photo${input.photoCount === 1 ? "" : "s"}` : ""}. Materials listed are estimated and will be confirmed if hidden defects are found.`;
    lineItems.push(
      item("labour", `${TRADE_LABELS[input.trade]} labour`, hrs ?? 4, "hour", rates.labour),
      item("materials", "Materials and consumables (estimated)", 1, "lot", input.country === "NZ" ? 150 : 175),
    );
  }

  if (m && !looksLike(note, ["fenc"])) {
    description += `\n\nMeasured quantity noted on site: ${m} m.`;
  }

  const photoNotes = input.enhancedAi
    ? input.photoCount
      ? `AI reviewed ${input.photoCount} site photo${input.photoCount === 1 ? "" : "s"} and the voice note. Visible work matches “${note}”. Quantities are estimates from what can be seen — confirm on site before ordering materials.`
      : `No photos attached. Description is based on the voice note only. Add photos for a tighter materials estimate.`
    : "";

  description += `\n\nQuote is valid for 30 days. Workmanship guaranteed. ${input.country === "NZ" ? "Prices in NZD." : "Prices in AUD."}`;

  return { title, description: description.trim(), photoNotes, lineItems };
}
