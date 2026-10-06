/**
 * Calendar dates are stored as "YYYY-MM-DD" strings and interpreted in the
 * viewer's local time zone. That avoids the classic off-by-one where
 * `new Date("2026-10-18")` is parsed as UTC midnight.
 */

export type ISODate = string;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(value: string): value is ISODate {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const date = parseISODate(value);
  return date.getMonth() + 1 === Number(match[2]) && date.getDate() === Number(match[3]);
}

export function parseISODate(value: ISODate): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function toISODate(date: Date): ISODate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function formatDate(
  value: ISODate,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
): string {
  return parseISODate(value).toLocaleDateString("en-US", options);
}

export function formatLongDate(value: ISODate): string {
  return formatDate(value, { weekday: "long", month: "long", day: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "Today", "Tomorrow", "in 3 days", "2 days ago". */
export function relativeDayLabel(value: ISODate, now: Date): string {
  const diff = daysBetween(now, parseISODate(value));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}
