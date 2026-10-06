import type { PickupWindowId } from "./config";
import { addDays, toISODate } from "./dates";
import { quotePickup } from "./pricing";
import {
  RETURN_STATUSES,
  type PickupAddress,
  type ReturnRecord,
  type ReturnStatus,
} from "./returns";

/** Demo account shown on the dashboard. Not a real person. */
export const DEMO_ACCOUNT = {
  firstName: "Alex",
  email: "alex@demo.returndone.app",
} as const;

export const DEMO_ADDRESS: PickupAddress = {
  line1: "10 W 35th St",
  city: "Chicago",
  state: "IL",
  zip: "60616",
};

interface Seed {
  id: string;
  retailerId: string;
  retailerName: string;
  itemDescription: string;
  itemCount?: number;
  refundAmount: number;
  reason: string;
  status: ReturnStatus;
  /** Pickup date relative to today. */
  pickupOffset: number;
  windowId: PickupWindowId;
  deadlineOffset: number;
  orderNumber?: string;
  carrier?: ReturnRecord["carrier"];
  hasQrCode?: boolean;
}

const SEEDS: Seed[] = [
  {
    id: "RD-2026-1847",
    retailerId: "amazon",
    retailerName: "Amazon",
    itemDescription: "Wireless noise-cancelling headphones",
    refundAmount: 129.99,
    reason: "Not as described",
    status: "refund_processing",
    pickupOffset: -6,
    windowId: "10-12",
    deadlineOffset: 14,
    orderNumber: "114-3920571-2284465",
    carrier: "UPS",
    hasQrCode: true,
  },
  {
    id: "RD-2026-2013",
    retailerId: "zara",
    retailerName: "Zara",
    itemDescription: "Black blazer, size M",
    refundAmount: 89.9,
    reason: "Doesn't fit",
    status: "pickup_scheduled",
    pickupOffset: 2,
    windowId: "18-20",
    deadlineOffset: 5,
    orderNumber: "60219384751",
  },
  {
    id: "RD-2026-1962",
    retailerId: "target",
    retailerName: "Target",
    itemDescription: "Ceramic table lamp",
    refundAmount: 34.99,
    reason: "Arrived damaged or defective",
    status: "in_transit",
    pickupOffset: -1,
    windowId: "08-10",
    deadlineOffset: 60,
    carrier: "FedEx",
  },
  {
    id: "RD-2026-2048",
    retailerId: "hm",
    retailerName: "H&M",
    itemDescription: "Linen shirts",
    itemCount: 2,
    refundAmount: 49.98,
    reason: "Changed my mind",
    status: "picked_up",
    pickupOffset: 0,
    windowId: "08-10",
    deadlineOffset: 21,
    carrier: "USPS",
  },
  {
    id: "RD-2026-1702",
    retailerId: "nike",
    retailerName: "Nike",
    itemDescription: "Air Max sneakers, size 9",
    refundAmount: 145.0,
    reason: "Doesn't fit",
    status: "refund_complete",
    pickupOffset: -15,
    windowId: "12-14",
    deadlineOffset: 20,
    carrier: "UPS",
    hasQrCode: true,
  },
  {
    id: "RD-2026-1588",
    retailerId: "walmart",
    retailerName: "Walmart",
    itemDescription: "Air fryer, 5 qt",
    refundAmount: 79.0,
    reason: "Better price elsewhere",
    status: "refund_complete",
    pickupOffset: -27,
    windowId: "14-16",
    deadlineOffset: 40,
  },
];

/** Days between status updates, used to back-fill a plausible history. */
const STEP_GAP_DAYS = [0, 1, 1, 2, 3];

function buildHistory(status: ReturnStatus, pickup: Date, created: Date, now: Date) {
  const reached = RETURN_STATUSES.slice(0, RETURN_STATUSES.indexOf(status) + 1);
  let cursor = new Date(pickup.getTime() + 50 * 60_000); // picked up 50 min into the window
  return reached.map((step, index) => {
    if (index === 0) return { status: step, at: created.toISOString() };
    if (index > 1) {
      cursor = addDays(cursor, STEP_GAP_DAYS[index - 1] ?? 1);
      cursor.setHours(9 + index, 30, 0, 0);
    }
    const at = cursor.getTime() > now.getTime() ? now : cursor;
    return { status: step, at: at.toISOString() };
  });
}

/** Builds the demo account's returns relative to `now`. */
export function createDemoReturns(now: Date): ReturnRecord[] {
  return SEEDS.map((seed) => {
    const pickupDay = addDays(now, seed.pickupOffset);
    const pickupAt = new Date(pickupDay);
    pickupAt.setHours(Number(seed.windowId.slice(0, 2)), 0, 0, 0);
    // Booked two evenings before pickup, but never later than "now".
    let created = addDays(pickupDay, -2);
    created.setHours(20, 12, 0, 0);
    if (created > now) {
      created = addDays(now, -1);
      created.setHours(20, 12, 0, 0);
    }
    const pickupDate = toISODate(pickupDay);
    const itemCount = seed.itemCount ?? 1;

    return {
      id: seed.id,
      createdAt: created.toISOString(),
      retailerId: seed.retailerId,
      retailerName: seed.retailerName,
      itemDescription: seed.itemDescription,
      itemCount,
      orderNumber: seed.orderNumber,
      reason: seed.reason,
      refundAmount: seed.refundAmount,
      returnDeadline: toISODate(addDays(pickupDay, seed.deadlineOffset)),
      hasOriginalPackaging: false,
      hasReturnLabel: Boolean(seed.carrier) && !seed.hasQrCode,
      hasQrCode: seed.hasQrCode,
      carrier: seed.carrier,
      pickup: {
        date: pickupDate,
        windowId: seed.windowId,
        address: DEMO_ADDRESS,
        instructions: seed.status === "pickup_scheduled" ? "Buzz 4B, I'll come down." : undefined,
      },
      price: quotePickup(itemCount, pickupDate),
      status: seed.status,
      history: buildHistory(seed.status, pickupAt, created, now),
    };
  });
}
