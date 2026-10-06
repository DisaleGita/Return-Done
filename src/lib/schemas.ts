import { z } from "zod";
import { assistantConfig, pricingConfig, schedulingConfig } from "./config";
import { isISODate } from "./dates";
import { CARRIERS, RETURN_REASONS, pickupBeatsDeadline } from "./returns";

const windowIds = schedulingConfig.windows.map((w) => w.id) as [string, ...string[]];

const isoDate = z.string().refine(isISODate, "Enter a valid date");

export const US_STATE = /^[A-Z]{2}$/;
export const US_ZIP = /^\d{5}(-\d{4})?$/;

/** First wizard step: where to send the confirmation, and where it was bought. */
export const retailerSchema = z.object({
  /** Used to send the confirmation only; never stored on the return. */
  contactEmail: z
    .email({
      error: (issue) =>
        issue.input === undefined || issue.input === ""
          ? "Enter your email so we can send your confirmation"
          : "Enter a valid email address",
    })
    .max(254),
  retailerId: z.string().min(1, "Choose where you bought it"),
  retailerName: z
    .string()
    .trim()
    .min(1, "Tell us the retailer's name")
    .max(60, "Keep it under 60 characters"),
});

export const detailsSchema = z.object({
  itemDescription: z
    .string()
    .trim()
    .min(2, "Describe the item so our driver knows what to collect")
    .max(120, "Keep it under 120 characters"),
  itemCount: z
    .number({ error: "Enter how many items" })
    .int("Use a whole number")
    .min(1, "At least one item")
    .max(
      pricingConfig.maxItemsPerPickup,
      `Up to ${pricingConfig.maxItemsPerPickup} items per pickup`,
    ),
  orderNumber: z.string().trim().max(40, "That order number looks too long").optional(),
  reason: z.enum(RETURN_REASONS).optional(),
  refundAmount: z
    .number({ error: "Enter an amount like 49.99" })
    .min(0, "Amount can't be negative")
    .max(10_000, "That seems high. Check the amount")
    .optional(),
  returnDeadline: isoDate.optional(),
  hasOriginalPackaging: z.boolean().optional(),
  hasReturnLabel: z.boolean().optional(),
  hasQrCode: z.boolean().optional(),
  carrier: z.enum(CARRIERS).optional(),
});

export const addressSchema = z.object({
  line1: z.string().trim().min(3, "Enter a street address").max(100),
  line2: z.string().trim().max(60).optional(),
  city: z.string().trim().min(2, "Enter a city").max(60),
  state: z.string().trim().toUpperCase().regex(US_STATE, "Use a 2-letter state, like IL"),
  zip: z.string().trim().regex(US_ZIP, "Enter a 5-digit ZIP code"),
});

export const pickupSchema = z.object({
  date: isoDate,
  windowId: z.enum(windowIds, { error: "Choose a pickup window" }),
  address: addressSchema,
  instructions: z.string().trim().max(300, "Keep instructions under 300 characters").optional(),
});

export const createReturnSchema = retailerSchema
  .extend(detailsSchema.shape)
  .extend({
    pickup: pickupSchema,
  })
  .superRefine((value, ctx) => {
    if (!pickupBeatsDeadline(value.pickup.date, value.returnDeadline)) {
      ctx.addIssue({
        code: "custom",
        path: ["pickup", "date"],
        message: "Pick a date on or before your return deadline",
      });
    }
  });

export type CreateReturnInput = z.infer<typeof createReturnSchema>;

export type FieldErrors = Record<string, string>;

/** Flattens zod issues to `{ "pickup.address.zip": "message" }`, first message wins. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    errors[key] ??= issue.message;
  }
  return errors;
}

export const assistantRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(20, "Paste a bit more. A full email or policy works best")
    .max(assistantConfig.maxInputChars, "That's a lot of text. Paste just the return section"),
});
