import type { PickupWindowId } from "./config";
import { daysBetween, parseISODate, type ISODate } from "./dates";
import type { PriceQuote } from "./pricing";

export const RETURN_STATUSES = [
  "pickup_scheduled",
  "picked_up",
  "in_transit",
  "delivered",
  "refund_processing",
  "refund_complete",
] as const;

export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const STATUS_META: Record<
  ReturnStatus,
  { label: string; description: string; tone: "brand" | "info" | "warning" | "success" }
> = {
  pickup_scheduled: {
    label: "Pickup Scheduled",
    description: "We'll be at your door during your pickup window.",
    tone: "brand",
  },
  picked_up: {
    label: "Picked Up",
    description: "Your items were checked at the door and are with us.",
    tone: "info",
  },
  in_transit: {
    label: "In Transit",
    description: "Packed, labeled and on the way back to the retailer.",
    tone: "info",
  },
  delivered: {
    label: "Delivered",
    description: "The retailer has received your return.",
    tone: "info",
  },
  refund_processing: {
    label: "Refund Processing",
    description: "The retailer is processing your refund.",
    tone: "warning",
  },
  refund_complete: {
    label: "Refund Complete",
    description: "Your refund has been issued.",
    tone: "success",
  },
};

export const RETURN_REASONS = [
  "Doesn't fit",
  "Changed my mind",
  "Arrived damaged or defective",
  "Not as described",
  "Wrong item received",
  "Better price elsewhere",
  "Unwanted gift",
  "Other",
] as const;

export const CARRIERS = ["UPS", "FedEx", "USPS", "DHL", "Amazon"] as const;
export type Carrier = (typeof CARRIERS)[number];

export interface PickupAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface StatusEvent {
  status: ReturnStatus;
  at: string; // ISO timestamp
}

export interface ReturnRecord {
  /** Customer-facing tracking number, e.g. RD-2026-1847. */
  id: string;
  createdAt: string;
  retailerId: string;
  retailerName: string;
  itemDescription: string;
  itemCount: number;
  orderNumber?: string;
  reason?: string;
  /** Amount the customer expects back. */
  refundAmount?: number;
  returnDeadline?: ISODate;
  hasOriginalPackaging?: boolean;
  hasReturnLabel?: boolean;
  hasQrCode?: boolean;
  carrier?: Carrier;
  pickup: {
    date: ISODate;
    windowId: PickupWindowId;
    address: PickupAddress;
    instructions?: string;
  };
  price: PriceQuote;
  status: ReturnStatus;
  history: StatusEvent[];
}

// ---------------------------------------------------------------------------
// Status progression
// ---------------------------------------------------------------------------

export function statusIndex(status: ReturnStatus): number {
  return RETURN_STATUSES.indexOf(status);
}

export function nextStatus(status: ReturnStatus): ReturnStatus | null {
  return RETURN_STATUSES[statusIndex(status) + 1] ?? null;
}

export function isComplete(record: Pick<ReturnRecord, "status">): boolean {
  return record.status === "refund_complete";
}

/** Moves a return one step forward. Completed returns are returned unchanged. */
export function advanceReturn(record: ReturnRecord, now: Date): ReturnRecord {
  const next = nextStatus(record.status);
  if (!next) return record;
  return {
    ...record,
    status: next,
    history: [...record.history, { status: next, at: now.toISOString() }],
  };
}

export interface TimelineStep {
  status: ReturnStatus;
  label: string;
  description: string;
  state: "complete" | "current" | "upcoming";
  at?: string;
}

export function buildTimeline(record: Pick<ReturnRecord, "status" | "history">): TimelineStep[] {
  const current = statusIndex(record.status);
  return RETURN_STATUSES.map((status, index) => ({
    status,
    label: STATUS_META[status].label,
    description: STATUS_META[status].description,
    state: index < current ? "complete" : index === current ? "current" : "upcoming",
    at: record.history.find((event) => event.status === status)?.at,
  }));
}

/** 0–100, for progress bars. */
export function progressPercent(status: ReturnStatus): number {
  return Math.round((statusIndex(status) / (RETURN_STATUSES.length - 1)) * 100);
}

// ---------------------------------------------------------------------------
// Deadlines
// ---------------------------------------------------------------------------

export type DeadlineUrgency = "none" | "ok" | "soon" | "urgent" | "passed";

export function deadlineUrgency(deadline: ISODate | undefined, now: Date): DeadlineUrgency {
  if (!deadline) return "none";
  const days = daysBetween(now, parseISODate(deadline));
  if (days < 0) return "passed";
  if (days <= 2) return "urgent";
  if (days <= 7) return "soon";
  return "ok";
}

/** A pickup has to happen on or before the retailer's return deadline. */
export function pickupBeatsDeadline(pickupDate: ISODate, deadline?: ISODate): boolean {
  if (!deadline) return true;
  return parseISODate(pickupDate).getTime() <= parseISODate(deadline).getTime();
}

/** Earliest deadline across returns, as the 2023 ops emails surfaced it. */
export function earliestDeadline(
  records: Pick<ReturnRecord, "returnDeadline">[],
): ISODate | undefined {
  return records
    .map((r) => r.returnDeadline)
    .filter((d): d is ISODate => Boolean(d))
    .sort()[0];
}

// ---------------------------------------------------------------------------
// Tracking numbers
// ---------------------------------------------------------------------------

export const TRACKING_NUMBER_PATTERN = /^RD-\d{4}-\d{4}$/;

/**
 * Generates a tracking number like RD-2026-1847. The 2023 version used a
 * random six-character code; this format is easier to read out over the phone.
 */
export function generateTrackingNumber(
  now: Date,
  taken: ReadonlySet<string> = new Set(),
  random: () => number = Math.random,
): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const serial = 1000 + Math.floor(random() * 9000);
    const id = `RD-${now.getFullYear()}-${serial}`;
    if (!taken.has(id)) return id;
  }
  throw new Error("Could not allocate a unique tracking number");
}

// ---------------------------------------------------------------------------
// Dashboard summaries
// ---------------------------------------------------------------------------

export interface ReturnsSummary {
  active: number;
  completed: number;
  refundsPending: number;
  refundedTotal: number;
  nextPickup?: ReturnRecord;
}

export function summarizeReturns(records: ReturnRecord[]): ReturnsSummary {
  const active = records.filter((r) => !isComplete(r));
  const completed = records.filter(isComplete);
  const sum = (list: ReturnRecord[]) =>
    Math.round(list.reduce((total, r) => total + (r.refundAmount ?? 0), 0) * 100) / 100;

  const nextPickup = active
    .filter((r) => r.status === "pickup_scheduled")
    .sort(
      (a, b) =>
        a.pickup.date.localeCompare(b.pickup.date) ||
        a.pickup.windowId.localeCompare(b.pickup.windowId),
    )[0];

  return {
    active: active.length,
    completed: completed.length,
    refundsPending: sum(active),
    refundedTotal: sum(completed),
    nextPickup,
  };
}

/** Active first (soonest pickup first), then completed (most recent first). */
export function sortReturns(records: ReturnRecord[]): ReturnRecord[] {
  return [...records].sort((a, b) => {
    const aDone = isComplete(a);
    const bDone = isComplete(b);
    if (aDone !== bDone) return aDone ? 1 : -1;
    if (aDone) return b.createdAt.localeCompare(a.createdAt);
    return a.pickup.date.localeCompare(b.pickup.date);
  });
}
