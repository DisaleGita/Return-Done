import { schedulingConfig, type PickupWindowId } from "./config";
import { addDays, parseISODate, toISODate, type ISODate } from "./dates";

export interface PickupWindow {
  id: PickupWindowId;
  label: string;
  available: boolean;
}

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${suffix}`;
}

export function windowLabel(id: string): string {
  const window = schedulingConfig.windows.find((w) => w.id === id);
  if (!window) return id;
  return `${formatHour(window.startHour)} – ${formatHour(window.endHour)}`;
}

export function isPickupWindowId(id: string): id is PickupWindowId {
  return schedulingConfig.windows.some((w) => w.id === id);
}

/**
 * Pickup windows for a date. Windows that start within the lead time are
 * unavailable, the same rule the 2023 form used to grey out same-day slots.
 */
export function getPickupWindows(date: ISODate, now: Date): PickupWindow[] {
  const day = parseISODate(date);
  const cutoff = now.getTime() + schedulingConfig.leadTimeMinutes * 60_000;

  return schedulingConfig.windows.map((window) => {
    const start = new Date(day);
    start.setHours(window.startHour, 0, 0, 0);
    return {
      id: window.id,
      label: windowLabel(window.id),
      available: start.getTime() >= cutoff,
    };
  });
}

export interface PickupDay {
  date: ISODate;
  available: boolean;
}

/** Bookable days, starting today. Days with no open windows are unavailable. */
export function getPickupDays(
  now: Date,
  horizon = schedulingConfig.bookingHorizonDays,
): PickupDay[] {
  return Array.from({ length: horizon }, (_, offset) => {
    const date = toISODate(addDays(now, offset));
    return { date, available: getPickupWindows(date, now).some((w) => w.available) };
  });
}

export function isSlotBookable(date: ISODate, windowId: string, now: Date): boolean {
  return getPickupWindows(date, now).some((w) => w.id === windowId && w.available);
}
