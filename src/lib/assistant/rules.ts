import { addDays, toISODate, daysBetween, type ISODate } from "../dates";
import { findRetailerInText } from "../retailers";
import type { Carrier } from "../returns";
import type { Requirement, ReturnExtraction, ReturnMethod } from "./types";

/**
 * Deterministic, dependency-free extraction used in demo mode and as the
 * fallback when no LLM is configured. It handles the phrasing in typical
 * retailer emails and policies, not every possible wording.
 */

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const MONTH_DATE =
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/gi;
const NUMERIC_DATE = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?\b/g;
const ISO_DATE = /\b(\d{4})-(\d{2})-(\d{2})\b/g;

const DEADLINE_CUE =
  /(return(?:ed)?\s+(?:it\s+)?by|eligible\s+(?:for\s+return\s+)?(?:until|through)|until|no\s+later\s+than|before|deadline|window\s+(?:closes|ends)|closes\s+on|ends\s+on|last\s+day)[^.\n]{0,40}$/i;
/** "…by Oct 20", "…before Monday, Oct 20" — a cue word right before the date. */
const IMMEDIATE_CUE =
  /\b(?:by|before|until|through|thru)\s+(?:(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?,?\s+)?$/i;
const START_CUE =
  /(deliver(?:ed|y)|arriv(?:ed|al)|purchas(?:ed|e)|order(?:ed)?\s+(?:on|date)|shipped|received)[^.\n]{0,30}$/i;

interface FoundDate {
  date: ISODate;
  index: number;
  text: string;
}

function inferYear(month: number, day: number, now: Date): number {
  const candidate = new Date(now.getFullYear(), month, day);
  // A month/day that's well in the past most likely refers to next year.
  return daysBetween(now, candidate) < -60 ? now.getFullYear() + 1 : now.getFullYear();
}

function makeDate(year: number, month: number, day: number): ISODate | null {
  const date = new Date(year, month, day);
  if (date.getMonth() !== month || date.getDate() !== day) return null;
  return toISODate(date);
}

export function findDates(text: string, now: Date): FoundDate[] {
  const found: FoundDate[] = [];

  for (const m of text.matchAll(MONTH_DATE)) {
    const month = MONTHS.indexOf(m[1]!.slice(0, 3).toLowerCase());
    const day = Number(m[2]);
    const year = m[3] ? Number(m[3]) : inferYear(month, day, now);
    const date = makeDate(year, month, day);
    if (date) found.push({ date, index: m.index!, text: m[0] });
  }
  for (const m of text.matchAll(NUMERIC_DATE)) {
    const month = Number(m[1]) - 1;
    const day = Number(m[2]);
    const rawYear = m[3] ? Number(m[3]) : undefined;
    const year =
      rawYear === undefined ? inferYear(month, day, now) : rawYear < 100 ? 2000 + rawYear : rawYear;
    const date = makeDate(year, month, day);
    if (date) found.push({ date, index: m.index!, text: m[0] });
  }
  for (const m of text.matchAll(ISO_DATE)) {
    const date = makeDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (date) found.push({ date, index: m.index!, text: m[0] });
  }
  return found.sort((a, b) => a.index - b.index);
}

function precedingText(text: string, index: number, length = 60) {
  return text.slice(Math.max(0, index - length), index);
}

function quote(text: string, index: number, matchLength: number): string {
  const start = text.lastIndexOf("\n", index) + 1;
  const endOfLine = text.indexOf("\n", index + matchLength);
  const line = text.slice(start, endOfLine === -1 ? undefined : endOfLine).trim();
  return line.length > 140 ? `${line.slice(0, 137)}…` : line;
}

export function extractDeadline(
  text: string,
  now: Date,
): Pick<ReturnExtraction, "deadline" | "deadlineEvidence" | "windowDays"> {
  const dates = findDates(text, now);
  const windowMatch =
    /within\s+(\d{1,3})\s+days?/i.exec(text) ??
    /(\d{1,3})\s+days?\s+(?:from|of|after)\b/i.exec(text) ??
    /(\d{1,3})[-\s]day\s+return/i.exec(text);
  const windowDays = windowMatch ? Number(windowMatch[1]) : null;

  const explicit = dates.find((d) => {
    const before = precedingText(text, d.index);
    return DEADLINE_CUE.test(before) || IMMEDIATE_CUE.test(before);
  });
  if (explicit) {
    return {
      deadline: explicit.date,
      deadlineEvidence: quote(text, explicit.index, explicit.text.length),
      windowDays,
    };
  }

  if (windowDays !== null) {
    const start = dates.find((d) => START_CUE.test(precedingText(text, d.index, 40)));
    if (start) {
      const [y, m, d] = start.date.split("-").map(Number);
      const deadline = toISODate(addDays(new Date(y!, m! - 1, d!), windowDays));
      return {
        deadline,
        deadlineEvidence: quote(text, windowMatch!.index, windowMatch![0].length),
        windowDays,
      };
    }
  }

  return { deadline: null, deadlineEvidence: null, windowDays };
}

export function extractCarrier(text: string): Carrier | null {
  const candidates: { carrier: Carrier; index: number }[] = [];
  const patterns: [Carrier, RegExp][] = [
    ["UPS", /\bUPS\b/],
    ["FedEx", /\bfed\s?ex\b/i],
    ["USPS", /\bUSPS\b|\bpost office\b|\bU\.S\. Postal\b/i],
    ["DHL", /\bDHL\b/],
  ];
  for (const [carrier, pattern] of patterns) {
    const match = pattern.exec(text);
    if (match) candidates.push({ carrier, index: match.index });
  }
  return candidates.sort((a, b) => a.index - b.index)[0]?.carrier ?? null;
}

export function extractMethod(text: string): ReturnMethod {
  if (/\bQR\b|qr[\s-]?code|scan\s+(?:the|this|your)\s+code/i.test(text)) return "qr_code";
  if (
    /print\s+(?:out\s+)?(?:the\s+|your\s+|a\s+)?(?:prepaid\s+|return\s+|shipping\s+)*label|printable\s+label/i.test(
      text,
    )
  )
    return "printed_label";
  if (/schedule\s+a\s+(?:carrier\s+)?pick\s?-?up|carrier\s+pick\s?-?up/i.test(text))
    return "carrier_pickup";
  if (/drop[\s-]?(?:it\s+|them\s+)?off|drop[\s-]?off\s+location/i.test(text)) return "drop_off";
  if (
    /in[\s-]store|at\s+any\s+(?:\w+\s+)?(?:store|location)|bring\s+(?:it|them|the\s+item)\s+to/i.test(
      text,
    )
  )
    return "in_store";
  return "unknown";
}

export function extractLabelRequirement(text: string, method: ReturnMethod): Requirement {
  if (
    /no\s+(?:printer|label|printing)\s+(?:is\s+)?(?:needed|required|necessary)|no\s+need\s+to\s+print|without\s+a\s+(?:printer|label)|(?:label|printer|box)[\s-]free/i.test(
      text,
    )
  )
    return "not_required";
  if (method === "qr_code" || method === "in_store") return "not_required";
  if (
    method === "printed_label" ||
    /label\s+(?:is\s+)?(?:required|included|attached)|attach\s+the\s+(?:return\s+)?label|prepaid\s+(?:return\s+)?label/i.test(
      text,
    )
  )
    return "required";
  return "unknown";
}

export function extractPackagingRequirement(text: string): Requirement {
  if (
    /with\s+or\s+without\s+(?:the\s+)?(?:original\s+)?(?:packaging|box)|no\s+(?:box|packaging)\s+(?:is\s+)?(?:needed|required)|box[\s-]free|no\s+need\s+to\s+(?:box|pack)|(?:don't|do\s+not)\s+need\s+(?:a\s+box|to\s+pack)/i.test(
      text,
    )
  )
    return "not_required";
  if (
    /original\s+(?:packaging|box)|in\s+(?:its|the)\s+original|securely\s+(?:packed|packaged)|pack\s+(?:the\s+)?items?\s+(?:securely|in)|place\s+(?:it|the\s+items?)\s+in\s+a\s+box/i.test(
      text,
    )
  )
    return "required";
  return "unknown";
}

export function extractConditions(text: string): string[] {
  const rules: [RegExp, string][] = [
    [
      /tags?\s+(?:still\s+)?attached|with\s+(?:all\s+)?(?:original\s+)?tags/i,
      "Tags must be attached",
    ],
    [/unworn|unwashed|unused|new\s+condition/i, "Item should be unused"],
    [/receipt|proof\s+of\s+purchase/i, "Proof of purchase may be needed"],
    [/restocking\s+fee/i, "A restocking fee may apply"],
    [/final\s+sale/i, "Final-sale items can't be returned"],
    [/hygien|earrings|swimwear|underwear/i, "Some hygiene items are excluded"],
  ];
  return rules.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
}

export function extractRefundAmount(text: string): number | null {
  const parse = (raw: string) => Number(raw.replace(/,/g, ""));
  const labelled =
    /(?:refund(?:\s+amount)?|order\s+total|total|amount|credit)[^$\n]{0,25}\$\s?(\d{1,5}(?:,\d{3})*(?:\.\d{2})?)/i.exec(
      text,
    );
  if (labelled) return parse(labelled[1]!);
  const any = /\$\s?(\d{1,5}(?:,\d{3})*(?:\.\d{2})?)/.exec(text);
  return any ? parse(any[1]!) : null;
}

export function extractOrderNumber(text: string): string | null {
  // The identifier must contain a digit, so "order confirmed" isn't an order number.
  const match =
    /order\s*(?:#|number|no\.?|id)?\s*[:#]?\s*((?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{4,})/i.exec(text);
  return match ? match[1]! : null;
}

export function extractItem(text: string): string | null {
  const match = /^\s*(?:item|product|returning|return\s+item)s?\s*:\s*(.+)$/im.exec(text);
  return match ? match[1]!.trim().slice(0, 120) : null;
}

export function extractWithRules(
  text: string,
  now: Date,
): ReturnExtraction & { retailerId: string | null } {
  const retailer = findRetailerInText(text);
  const method = extractMethod(text);
  return {
    retailer: retailer?.name ?? null,
    retailerId: retailer?.id ?? null,
    orderNumber: extractOrderNumber(text),
    itemDescription: extractItem(text),
    refundAmount: extractRefundAmount(text),
    ...extractDeadline(text, now),
    method,
    carrier: extractCarrier(text),
    labelRequirement: extractLabelRequirement(text, method),
    packagingRequirement: extractPackagingRequirement(text),
    conditions: extractConditions(text),
  };
}
