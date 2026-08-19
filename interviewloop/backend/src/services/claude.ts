import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

export const anthropic = new Anthropic({ apiKey });

/**
 * All interviewer logic (questions, nudges, evaluation) runs on this model.
 * Kept as a single named export so swapping models later is a one-line change.
 */
export const INTERVIEWER_MODEL = "claude-sonnet-5";

/**
 * Central place to pick a model for a given call site. Currently every
 * caller uses the same model, but keeping this indirection means Phase 2+
 * services (interviewer.ts, evaluator.ts) never hardcode a model string.
 */
export function routeModel(_purpose: "interview" | "evaluation"): string {
  return INTERVIEWER_MODEL;
}
