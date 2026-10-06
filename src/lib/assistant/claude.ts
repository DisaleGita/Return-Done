import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { assistantConfig } from "../config";
import { toISODate } from "../dates";
import { extractionSchema, type ReturnExtraction } from "./types";

const SYSTEM_PROMPT = `You extract facts from retail return instructions, order confirmation emails and return policies for Return Done, a doorstep return pickup service.

Only report what the text supports. Use null or "unknown" when the text doesn't say. Do not guess a retailer from product names alone.

For the deadline: if the text gives an explicit last day, use it. If it gives a window ("within 30 days of delivery") and the start date, compute the last day. Dates without a year refer to the next occurrence relative to today's date. Quote the phrase you relied on in deadlineEvidence.

method is how the customer hands the item over: qr_code (scan a code at a carrier counter), printed_label, drop_off, carrier_pickup, in_store, or unknown. labelRequirement is whether the customer must print a label. Keep each condition under eight words.`;

export class ClaudeUnavailableError extends Error {}

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function extractWithClaude(text: string, now: Date): Promise<ReturnExtraction> {
  const client = new Anthropic({ timeout: 30_000, maxRetries: 1 });

  try {
    const response = await client.messages.parse({
      model: process.env.ANTHROPIC_MODEL || assistantConfig.defaultModel,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Today's date is ${toISODate(now)}.\n\n<return_text>\n${text}\n</return_text>`,
        },
      ],
      output_config: { effort: "low", format: zodOutputFormat(extractionSchema) },
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      throw new ClaudeUnavailableError(
        `No structured output (stop_reason: ${response.stop_reason})`,
      );
    }
    return response.parsed_output;
  } catch (error) {
    if (error instanceof ClaudeUnavailableError) throw error;
    if (error instanceof Anthropic.AuthenticationError) {
      throw new ClaudeUnavailableError("Anthropic API key was rejected");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new ClaudeUnavailableError("Anthropic API rate limit reached");
    }
    if (error instanceof Anthropic.APIError) {
      throw new ClaudeUnavailableError(`Anthropic API error ${error.status ?? ""}`.trim());
    }
    throw new ClaudeUnavailableError(error instanceof Error ? error.message : "Unknown error");
  }
}
