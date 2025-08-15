/**
 * Lightweight heuristic classifiers mapping raw error messages to
 * MalformedResponseCategory values for metrics & repair branching.
 */

import type { MalformedResponseCategory } from "./types.js";

export function classifyPlanError(message: string): MalformedResponseCategory {
  if (/Semantic validation failed/i.test(message))
    return "semantic_violation";
  if (/Invalid enum value|executionStrategy/i.test(message))
    return "invalid_enum_value";
  if (/depends on unknown endpoint|self-dependency|circular/i.test(message))
    return "structural_inconsistency";
  if (/ZodError|schema|parsing|parse/i.test(message))
    return "schema_parse_error";
  if (/empty|no content|missing/i.test(message))
    return "empty_response";
  return "schema_parse_error";
}

export function classifyScheduleError(message: string): MalformedResponseCategory {
  if (/Semantic validation failed/i.test(message))
    return "semantic_violation";
  if (/ZodError|schema|parsing|parse/i.test(message))
    return "schema_parse_error";
  if (/empty|no content|missing/i.test(message))
    return "empty_response";
  return "schema_parse_error";
}
