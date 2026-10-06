import { z } from "zod";
import { CARRIERS } from "../returns";

export const RETURN_METHODS = [
  "qr_code",
  "printed_label",
  "drop_off",
  "carrier_pickup",
  "in_store",
  "unknown",
] as const;

export const REQUIREMENTS = ["required", "not_required", "unknown"] as const;

/**
 * Facts pulled out of pasted return instructions. The same schema constrains
 * the LLM's structured output, so both engines produce identical shapes.
 */
export const extractionSchema = z.object({
  retailer: z.string().nullable().describe("Retailer or brand the item was bought from"),
  orderNumber: z.string().nullable(),
  itemDescription: z.string().nullable().describe("Short description of the item being returned"),
  refundAmount: z.number().nullable().describe("Expected refund in dollars"),
  deadline: z
    .string()
    .nullable()
    .describe(
      "Last day to return, as YYYY-MM-DD. Compute it if the text gives a window and a start date",
    ),
  deadlineEvidence: z.string().nullable().describe("The phrase the deadline came from, quoted"),
  windowDays: z.number().int().nullable().describe("Return window length in days, if stated"),
  method: z.enum(RETURN_METHODS),
  carrier: z.enum(CARRIERS).nullable(),
  labelRequirement: z.enum(REQUIREMENTS).describe("Does the customer need to print a label?"),
  packagingRequirement: z
    .enum(REQUIREMENTS)
    .describe("Does the item need to be boxed or packaged?"),
  conditions: z.array(z.string()).describe("Short conditions such as 'Tags must be attached'"),
});

export type ReturnExtraction = z.infer<typeof extractionSchema>;
export type ReturnMethod = ReturnExtraction["method"];
export type Requirement = ReturnExtraction["labelRequirement"];

export type AssistantEngine = "rules" | "claude";

export interface NextAction {
  title: string;
  detail: string;
  urgency: "normal" | "soon" | "urgent" | "passed" | "unknown";
}

export interface AssistantResult {
  engine: AssistantEngine;
  extraction: ReturnExtraction & { retailerId: string | null };
  summary: string;
  nextAction: NextAction;
  /** Shown to the user, e.g. when the LLM was unavailable and rules were used. */
  notice?: string;
}
