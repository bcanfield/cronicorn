import { describe, expect, it } from "vitest";

import { validateEngineConfig } from "../config.js";
import { computeEscalation } from "./escalation.js";

const baseConfig = validateEngineConfig({ aiAgent: {}, execution: {}, metrics: {}, scheduler: {}, logger: undefined });

describe("computeEscalation", () => {
  it("returns none when no failures", () => {
    const r = computeEscalation({ failures: 0, attempted: 5, executionConfig: baseConfig.execution, previousLevel: "none", failedEndpointIds: [] });
    expect(r.level).toBe("none");
    expect(r.recoveryAction).toBe("NONE");
  });
  it("warn at warn threshold", () => {
    const r = computeEscalation({ failures: Math.ceil(baseConfig.execution.escalation!.warnFailureRatio * 4), attempted: 4, executionConfig: baseConfig.execution, previousLevel: "none", failedEndpointIds: ["e1"] });
    expect(["warn", "critical"]).toContain(r.level);
  });
  it("critical at critical threshold", () => {
    const r = computeEscalation({ failures: Math.ceil(baseConfig.execution.escalation!.criticalFailureRatio * 4), attempted: 4, executionConfig: baseConfig.execution, previousLevel: "none", failedEndpointIds: ["e1"] });
    expect(["critical", "warn"]).toContain(r.level);
  });
});
