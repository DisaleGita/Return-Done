import type { PickupWindowId } from "./config";
import { quotePickup } from "./pricing";
import { generateTrackingNumber, type ReturnRecord } from "./returns";
import type { CreateReturnInput } from "./schemas";

/** Turns validated input into a new return in the "Pickup Scheduled" state. */
export function buildReturnRecord(
  input: CreateReturnInput,
  now: Date,
  takenIds: ReadonlySet<string> = new Set(),
): ReturnRecord {
  const createdAt = now.toISOString();
  return {
    id: generateTrackingNumber(now, takenIds),
    createdAt,
    retailerId: input.retailerId,
    retailerName: input.retailerName,
    itemDescription: input.itemDescription,
    itemCount: input.itemCount,
    orderNumber: input.orderNumber || undefined,
    reason: input.reason,
    refundAmount: input.refundAmount,
    returnDeadline: input.returnDeadline,
    hasOriginalPackaging: input.hasOriginalPackaging,
    hasReturnLabel: input.hasReturnLabel,
    hasQrCode: input.hasQrCode,
    carrier: input.carrier,
    pickup: {
      date: input.pickup.date,
      windowId: input.pickup.windowId as PickupWindowId,
      address: { ...input.pickup.address, line2: input.pickup.address.line2 || undefined },
      instructions: input.pickup.instructions || undefined,
    },
    price: quotePickup(input.itemCount, input.pickup.date),
    status: "pickup_scheduled",
    history: [{ status: "pickup_scheduled", at: createdAt }],
  };
}
