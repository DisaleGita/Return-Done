export interface Retailer {
  id: string;
  name: string;
  /** Alternative spellings used when matching search input or pasted text. */
  aliases?: string[];
  /** Typical return window in days, shown as a hint only. */
  typicalWindowDays?: number;
  category: "Marketplace" | "Department" | "Apparel" | "Electronics" | "Home" | "Beauty";
}

/**
 * Retailers customers commonly return to. Listed for convenience; Return Done
 * has no formal partnership with any of them.
 */
export const RETAILERS: readonly Retailer[] = [
  { id: "amazon", name: "Amazon", category: "Marketplace", typicalWindowDays: 30 },
  { id: "target", name: "Target", category: "Department", typicalWindowDays: 90 },
  { id: "walmart", name: "Walmart", category: "Department", typicalWindowDays: 90 },
  { id: "zara", name: "Zara", category: "Apparel", typicalWindowDays: 30 },
  {
    id: "hm",
    name: "H&M",
    aliases: ["H & M", "H and M", "HM"],
    category: "Apparel",
    typicalWindowDays: 30,
  },
  { id: "nike", name: "Nike", category: "Apparel", typicalWindowDays: 60 },
  {
    id: "best-buy",
    name: "Best Buy",
    aliases: ["BestBuy"],
    category: "Electronics",
    typicalWindowDays: 15,
  },
  { id: "adidas", name: "Adidas", category: "Apparel", typicalWindowDays: 30 },
  { id: "uniqlo", name: "Uniqlo", category: "Apparel", typicalWindowDays: 30 },
  { id: "nordstrom", name: "Nordstrom", category: "Department" },
  { id: "sephora", name: "Sephora", category: "Beauty", typicalWindowDays: 30 },
  {
    id: "home-depot",
    name: "Home Depot",
    aliases: ["The Home Depot"],
    category: "Home",
    typicalWindowDays: 90,
  },
  { id: "ikea", name: "IKEA", category: "Home", typicalWindowDays: 365 },
  { id: "apple", name: "Apple", category: "Electronics", typicalWindowDays: 14 },
  {
    id: "lululemon",
    name: "Lululemon",
    aliases: ["lululemon athletica"],
    category: "Apparel",
    typicalWindowDays: 30,
  },
  {
    id: "foot-locker",
    name: "Foot Locker",
    aliases: ["Footlocker"],
    category: "Apparel",
    typicalWindowDays: 45,
  },
  {
    id: "macys",
    name: "Macy's",
    aliases: ["Macys"],
    category: "Department",
    typicalWindowDays: 30,
  },
  { id: "wayfair", name: "Wayfair", category: "Home", typicalWindowDays: 30 },
  {
    id: "tj-maxx",
    name: "TJ Maxx",
    aliases: ["T.J. Maxx", "TJMaxx"],
    category: "Department",
    typicalWindowDays: 30,
  },
  {
    id: "dicks",
    name: "Dick's Sporting Goods",
    aliases: ["Dicks Sporting Goods", "Dick's"],
    category: "Apparel",
    typicalWindowDays: 90,
  },
];

/** Shown first in the retailer picker. */
export const POPULAR_RETAILER_IDS = [
  "amazon",
  "target",
  "walmart",
  "zara",
  "hm",
  "nike",
  "best-buy",
];

export const OTHER_RETAILER_ID = "other";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getRetailer(id: string): Retailer | undefined {
  return RETAILERS.find((retailer) => retailer.id === id);
}

/** Case- and punctuation-insensitive search over names and aliases. */
export function searchRetailers(query: string): Retailer[] {
  const needle = normalize(query);
  if (!needle) return [...RETAILERS];
  const compact = needle.replace(/ /g, "");

  const scored = RETAILERS.map((retailer) => {
    const names = [retailer.name, ...(retailer.aliases ?? [])].map(normalize);
    let score = Infinity;
    for (const name of names) {
      if (name === needle || name.replace(/ /g, "") === compact) score = Math.min(score, 0);
      else if (name.startsWith(needle)) score = Math.min(score, 1);
      else if (name.split(" ").some((word) => word.startsWith(needle))) score = Math.min(score, 2);
      else if (name.replace(/ /g, "").includes(compact)) score = Math.min(score, 3);
    }
    return { retailer, score };
  });

  return scored
    .filter((entry) => entry.score !== Infinity)
    .sort((a, b) => a.score - b.score || a.retailer.name.localeCompare(b.retailer.name))
    .map((entry) => entry.retailer);
}

/** Finds the first retailer mentioned in free text, e.g. a pasted email. */
export function findRetailerInText(text: string): Retailer | undefined {
  let best: { retailer: Retailer; index: number } | undefined;
  for (const retailer of RETAILERS) {
    for (const name of [retailer.name, ...(retailer.aliases ?? [])]) {
      if (name.length < 3) continue; // "HM" etc. would match too much prose
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
      const match = new RegExp(`(^|[^A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, "i").exec(text);
      if (match && (!best || match.index < best.index)) best = { retailer, index: match.index };
    }
  }
  return best?.retailer;
}
