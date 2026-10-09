"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Removes anything personal from a page address before it's counted. Query
 * strings can hold order numbers, items and amounts (the assistant passes them
 * to /schedule), and return pages include tracking numbers in the path.
 */
export function anonymizeUrl(url: string): string {
  const parsed = new URL(url);
  parsed.search = "";
  parsed.hash = "";
  parsed.pathname = parsed.pathname.replace(/^\/returns\/[^/]+/, "/returns/[id]");
  return parsed.toString();
}

const beforeSend = (event: BeforeSendEvent): BeforeSendEvent => ({
  ...event,
  url: anonymizeUrl(event.url),
});

/** Vercel Web Analytics: cookieless, aggregate page views. */
export function SiteAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
