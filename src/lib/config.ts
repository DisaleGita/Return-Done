/**
 * Central product configuration. Prices, pickup windows and site links live
 * here so they can change without hunting through components.
 */

/**
 * Public URL of the site. Vercel provides the production domain
 * automatically, so NEXT_PUBLIC_SITE_URL is only needed to override it.
 */
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "Return Done",
  tagline: "The easiest way to return anything.",
  description:
    "Schedule a doorstep pickup and let Return Done handle the annoying part of online returns.",
  url: resolveSiteUrl(),
  foundedIn: "Chicago, 2023",
  repoUrl: process.env.NEXT_PUBLIC_REPO_URL || "https://github.com/DisaleGita/Return-Done",
  founder: {
    name: "Gita Disale",
    role: "Co-Founder & CTO",
    portfolioUrl: "https://www.gitadisale.com",
    linkedInUrl:
      process.env.NEXT_PUBLIC_FOUNDER_LINKEDIN_URL || "https://www.linkedin.com/in/gita-disale/",
    githubUrl: "https://github.com/DisaleGita",
  },
} as const;

export const pricingConfig = {
  currency: "USD",
  /** One item picked up from your door. */
  singleItem: 7.99,
  /** Two or more items from the same retailer, one pickup. */
  multiItem: 12.99,
  /**
   * "Return Day" carried over from the 2023 service: Saturday routes were
   * batched, so Saturday pickups were cheaper.
   */
  returnDay: {
    weekday: 6, // Saturday (Date#getDay)
    discount: 2,
  },
  maxItemsPerPickup: 10,
} as const;

export const schedulingConfig = {
  /** How many days ahead customers can book, including today. */
  bookingHorizonDays: 14,
  /** A window can't be booked once it starts within this many minutes. */
  leadTimeMinutes: 60,
  /** The original 2023 two-hour pickup windows, 8 AM – 8 PM. */
  windows: [
    { id: "08-10", startHour: 8, endHour: 10 },
    { id: "10-12", startHour: 10, endHour: 12 },
    { id: "12-14", startHour: 12, endHour: 14 },
    { id: "14-16", startHour: 14, endHour: 16 },
    { id: "16-18", startHour: 16, endHour: 18 },
    { id: "18-20", startHour: 18, endHour: 20 },
  ],
} as const;

export type PickupWindowId = (typeof schedulingConfig.windows)[number]["id"];

/** Caps on real confirmation emails from the public demo. Override with env vars. */
export const emailLimits = {
  /** Different people who can receive email. EMAIL_MAX_RECIPIENTS=0 turns the cap off. */
  maxRecipients: 50,
  /** Emails any one address can receive. */
  maxPerRecipient: 3,
} as const;

export const assistantConfig = {
  maxInputChars: 8000,
  defaultModel: "claude-opus-5",
} as const;
