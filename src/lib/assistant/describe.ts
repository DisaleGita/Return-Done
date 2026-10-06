import { daysBetween, formatDate, parseISODate } from "../dates";
import type { NextAction, ReturnExtraction } from "./types";

const METHOD_PHRASE: Record<ReturnExtraction["method"], (carrier: string | null) => string | null> =
  {
    qr_code: (c) => (c ? `The return uses a ${c} QR code.` : "The return uses a QR code."),
    printed_label: (c) =>
      c ? `It ships with a prepaid ${c} label.` : "It ships with a prepaid return label.",
    drop_off: (c) =>
      c ? `It's dropped off with ${c}.` : "It needs to be dropped off at a drop-off point.",
    carrier_pickup: (c) =>
      c ? `${c} can collect it from your door.` : "The carrier can collect it from your door.",
    in_store: () => "It can also be returned in store.",
    unknown: () => null,
  };

/** One or two plain-English sentences summarizing the extraction. */
export function summarize(extraction: ReturnExtraction, now: Date): string {
  const who = extraction.retailer ? `Your ${extraction.retailer} return` : "Your return";
  const parts: string[] = [];

  if (extraction.deadline) {
    const date = formatDate(extraction.deadline, { month: "long", day: "numeric" });
    const passed = daysBetween(now, parseISODate(extraction.deadline)) < 0;
    parts.push(
      passed
        ? `${who} window appears to have closed on ${date}.`
        : `${who} is eligible until ${date}.`,
    );
  } else {
    const forWhat = extraction.retailer ? `your ${extraction.retailer} return` : "this return";
    parts.push(`We couldn't find a return deadline for ${forWhat}.`);
  }

  if (extraction.labelRequirement === "not_required") parts.push("No printer is required.");
  else if (extraction.labelRequirement === "required") parts.push("A printed label is required.");

  const method = METHOD_PHRASE[extraction.method](extraction.carrier);
  if (method) parts.push(method);

  if (extraction.packagingRequirement === "required") parts.push("It needs to be packaged.");
  else if (extraction.packagingRequirement === "not_required") parts.push("No box needed.");

  return parts.join(" ");
}

export function recommendNextAction(extraction: ReturnExtraction, now: Date): NextAction {
  if (!extraction.deadline) {
    return {
      title: "Confirm your return deadline",
      detail:
        "Check your order page for the last day to return, then schedule a pickup. We'll keep the deadline on your dashboard.",
      urgency: "unknown",
    };
  }

  const days = daysBetween(now, parseISODate(extraction.deadline));
  const date = formatDate(extraction.deadline, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (days < 0) {
    return {
      title: "Contact the retailer first",
      detail: `The return window looks like it ended on ${date}. Some retailers make exceptions, so ask them before sending anything back.`,
      urgency: "passed",
    };
  }
  if (days <= 2) {
    return {
      title: "Schedule a pickup today",
      detail: `Only ${days === 0 ? "today" : days === 1 ? "1 day" : `${days} days`} left. Book the earliest pickup window so it's out the door before ${date}.`,
      urgency: "urgent",
    };
  }
  if (days <= 7) {
    return {
      title: "Schedule a pickup this week",
      detail: `You have ${days} days. A pickup in the next few days leaves plenty of room before ${date}.`,
      urgency: "soon",
    };
  }
  return {
    title: "Schedule a doorstep pickup",
    detail: `No rush. You have until ${date}. Pick a window that suits you and we'll take it from there.`,
    urgency: "normal",
  };
}
