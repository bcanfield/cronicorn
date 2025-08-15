import { describe, expect, it } from "vitest";

import { classifyPlanError, classifyScheduleError } from "./classification.js";

// Focused unit tests for error classification heuristics

describe("classification - plan", () => {
  const cases: Array<[string, string]> = [
    ["Semantic validation failed: something", "semantic_violation"],
    ["Invalid enum value for executionStrategy", "invalid_enum_value"],
    ["endpoint X depends on unknown endpoint Y", "structural_inconsistency"],
    ["ZodError: parsing issue", "schema_parse_error"],
    ["empty response from model", "empty_response"],
    ["unrecognized message", "schema_parse_error"], // default fallback
  ];
  for (const [msg, expected] of cases) {
    it(`maps '${msg}' => ${expected}`, () => {
      expect(classifyPlanError(msg)).toBe(expected);
    });
  }
});

describe("classification - schedule", () => {
  const cases: Array<[string, string]> = [
    ["Semantic validation failed: timing", "semantic_violation"],
    ["ZodError: nextRunAt invalid", "schema_parse_error"],
    ["empty schedule payload", "empty_response"],
    ["weird unknown", "schema_parse_error"],
  ];
  for (const [msg, expected] of cases) {
    it(`maps '${msg}' => ${expected}`, () => {
      expect(classifyScheduleError(msg)).toBe(expected);
    });
  }
});
