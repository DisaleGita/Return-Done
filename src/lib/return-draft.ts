import { checkDomainRules } from "./email/email-rules";
import { OTHER_RETAILER_ID, getRetailer } from "./retailers";
import { daysBetween, isISODate, parseISODate } from "./dates";
import { isSlotBookable } from "./scheduling";
import { CARRIERS } from "./returns";
import {
  addressSchema,
  createReturnSchema,
  detailsSchema,
  retailerSchema,
  toFieldErrors,
  type CreateReturnInput,
  type FieldErrors,
} from "./schemas";

export type YesNo = "" | "yes" | "no";

/**
 * The scheduling form's working state. Everything is a string so inputs stay
 * controlled; `draftToInput` converts it to the typed API payload.
 */
export interface ReturnDraft {
  retailerId: string;
  customRetailerName: string;
  itemDescription: string;
  itemCount: string;
  orderNumber: string;
  reason: string;
  refundAmount: string;
  returnDeadline: string;
  hasOriginalPackaging: YesNo;
  hasReturnLabel: YesNo;
  hasQrCode: YesNo;
  carrier: string;
  pickupDate: string;
  windowId: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  instructions: string;
  contactEmail: string;
}

export const EMPTY_DRAFT: ReturnDraft = {
  retailerId: "",
  customRetailerName: "",
  itemDescription: "",
  itemCount: "1",
  orderNumber: "",
  reason: "",
  refundAmount: "",
  returnDeadline: "",
  hasOriginalPackaging: "",
  hasReturnLabel: "",
  hasQrCode: "",
  carrier: "",
  pickupDate: "",
  windowId: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  instructions: "",
  contactEmail: "",
};

export const WIZARD_STEPS = [
  { id: "retailer", title: "Start" },
  { id: "details", title: "Details" },
  { id: "method", title: "Method" },
  { id: "pickup", title: "Pickup" },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

const optionalText = (value: string) => value.trim() || undefined;
const optionalBool = (value: YesNo) => (value === "" ? undefined : value === "yes");
const optionalNumber = (value: string) => {
  const trimmed = value.replace(/[$,\s]/g, "");
  return trimmed === "" ? undefined : Number(trimmed);
};

export function retailerNameFor(
  draft: Pick<ReturnDraft, "retailerId" | "customRetailerName">,
): string {
  if (draft.retailerId === OTHER_RETAILER_ID) return draft.customRetailerName.trim();
  return getRetailer(draft.retailerId)?.name ?? "";
}

export function draftToInput(draft: ReturnDraft): Record<string, unknown> {
  return {
    retailerId: draft.retailerId,
    retailerName: retailerNameFor(draft),
    itemDescription: draft.itemDescription,
    itemCount: optionalNumber(draft.itemCount) ?? Number.NaN,
    orderNumber: optionalText(draft.orderNumber),
    reason: optionalText(draft.reason),
    refundAmount: optionalNumber(draft.refundAmount),
    returnDeadline: optionalText(draft.returnDeadline),
    hasOriginalPackaging: optionalBool(draft.hasOriginalPackaging),
    hasReturnLabel: optionalBool(draft.hasReturnLabel),
    hasQrCode: optionalBool(draft.hasQrCode),
    carrier: optionalText(draft.carrier),
    pickup: {
      date: draft.pickupDate,
      windowId: draft.windowId,
      address: {
        line1: draft.line1,
        line2: optionalText(draft.line2),
        city: draft.city,
        state: draft.state,
        zip: draft.zip,
      },
      instructions: optionalText(draft.instructions),
    },
    contactEmail: optionalText(draft.contactEmail),
  };
}

/** Validates the fields owned by one wizard step. Keys match draft field names. */
/**
 * Problems with the email the customer typed: format, then typos ("gnail.com"),
 * placeholders ("abc.com") and throwaway inboxes. Shown while they fill in the
 * form; the server repeats these checks and also looks up the domain.
 */
export function checkContactEmail(value: string): { message: string; suggestion?: string } | null {
  const email = value.trim();
  if (!email) return { message: "Enter your email so we can send your confirmation" };
  const format = retailerSchema.shape.contactEmail.safeParse(email);
  if (!format.success) return { message: "Enter a valid email address" };
  const rules = checkDomainRules(email);
  return rules.ok ? null : { message: rules.message, suggestion: rules.suggestion };
}

export function validateStep(step: WizardStepId, draft: ReturnDraft, now: Date): FieldErrors {
  const input = draftToInput(draft);

  if (step === "retailer") {
    const result = retailerSchema.safeParse(input);
    const errors = result.success ? {} : toFieldErrors(result.error);
    const emailProblem = errors.contactEmail ? null : checkContactEmail(draft.contactEmail);
    if (emailProblem) errors.contactEmail = emailProblem.message;
    // The name error belongs to the "Other retailer" text field.
    if (errors.retailerName) {
      if (draft.retailerId === OTHER_RETAILER_ID) errors.customRetailerName = errors.retailerName;
      delete errors.retailerName;
    }
    return errors;
  }

  if (step === "details") {
    const result = detailsSchema.safeParse(input);
    const errors = result.success ? {} : toFieldErrors(result.error);
    if (
      !errors.returnDeadline &&
      draft.returnDeadline &&
      isISODate(draft.returnDeadline) &&
      daysBetween(now, parseISODate(draft.returnDeadline)) < 0
    ) {
      errors.returnDeadline = "That deadline has already passed. Check with the retailer first";
    }
    return errors;
  }

  if (step === "pickup") {
    const errors: FieldErrors = {};
    if (!draft.pickupDate) errors.pickupDate = "Choose a pickup day";
    if (!draft.windowId) errors.windowId = "Choose a pickup window";
    else if (draft.pickupDate && !isSlotBookable(draft.pickupDate, draft.windowId, now)) {
      errors.windowId = "That window is no longer available. Pick another";
    }

    const address = addressSchema.safeParse((input.pickup as { address: unknown }).address);
    if (!address.success) Object.assign(errors, toFieldErrors(address.error));

    const full = createReturnSchema.safeParse(input);
    if (!full.success) {
      const fullErrors = toFieldErrors(full.error);
      if (fullErrors["pickup.date"] && !errors.pickupDate)
        errors.pickupDate = fullErrors["pickup.date"];
      if (fullErrors["pickup.instructions"])
        errors.instructions = fullErrors["pickup.instructions"];
    }
    return errors;
  }

  return {};
}

/** Builds a draft from URL params, e.g. when the Smart Return Assistant hands off. */
export function draftFromParams(params: URLSearchParams): Partial<ReturnDraft> {
  const draft: Partial<ReturnDraft> = {};
  const retailer = params.get("retailer");
  if (retailer && getRetailer(retailer)) draft.retailerId = retailer;
  else if (retailer) {
    draft.retailerId = OTHER_RETAILER_ID;
    draft.customRetailerName = retailer.slice(0, 60);
  }
  const deadline = params.get("deadline");
  if (deadline && isISODate(deadline)) draft.returnDeadline = deadline;
  const order = params.get("order");
  if (order) draft.orderNumber = order.slice(0, 40);
  const item = params.get("item");
  if (item) draft.itemDescription = item.slice(0, 120);
  const amount = params.get("amount");
  if (amount && !Number.isNaN(Number(amount))) draft.refundAmount = amount;
  const carrier = params.get("carrier");
  if (carrier && (CARRIERS as readonly string[]).includes(carrier)) draft.carrier = carrier;
  const label = params.get("label");
  if (label === "yes" || label === "no") draft.hasReturnLabel = label;
  const qr = params.get("qr");
  if (qr === "yes" || qr === "no") draft.hasQrCode = qr;
  return draft;
}

export function parseCreateInput(draft: ReturnDraft): CreateReturnInput | null {
  const result = createReturnSchema.safeParse(draftToInput(draft));
  return result.success ? result.data : null;
}
