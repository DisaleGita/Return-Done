import "server-only";
import { isISODate } from "../dates";
import { findRetailerInText } from "../retailers";
import { ClaudeUnavailableError, extractWithClaude, isClaudeConfigured } from "./claude";
import { recommendNextAction, summarize } from "./describe";
import { extractWithRules } from "./rules";
import type { AssistantResult, ReturnExtraction } from "./types";

function withRetailerId(extraction: ReturnExtraction): AssistantResult["extraction"] {
  const known = extraction.retailer ? findRetailerInText(extraction.retailer) : undefined;
  return {
    ...extraction,
    retailer: known?.name ?? extraction.retailer,
    retailerId: known?.id ?? null,
    // Never trust a model-produced date string without checking it.
    deadline: extraction.deadline && isISODate(extraction.deadline) ? extraction.deadline : null,
  };
}

/**
 * Analyzes pasted return text. Uses Claude when ANTHROPIC_API_KEY is set and
 * falls back to the deterministic rule-based extractor otherwise, or if the
 * API call fails, so the feature always works.
 */
export async function analyzeReturnText(text: string, now: Date): Promise<AssistantResult> {
  if (isClaudeConfigured()) {
    try {
      const extraction = withRetailerId(await extractWithClaude(text, now));
      return {
        engine: "claude",
        extraction,
        summary: summarize(extraction, now),
        nextAction: recommendNextAction(extraction, now),
      };
    } catch (error) {
      const reason = error instanceof ClaudeUnavailableError ? error.message : "unexpected error";
      console.warn(`[assistant] Claude unavailable, using rules: ${reason}`);
      const extraction = extractWithRules(text, now);
      return {
        engine: "rules",
        extraction,
        summary: summarize(extraction, now),
        nextAction: recommendNextAction(extraction, now),
        notice:
          "The AI provider couldn't be reached, so this result comes from the built-in demo parser.",
      };
    }
  }

  const extraction = extractWithRules(text, now);
  return {
    engine: "rules",
    extraction,
    summary: summarize(extraction, now),
    nextAction: recommendNextAction(extraction, now),
  };
}
