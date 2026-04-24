import { describe, expect, it } from "vitest";
import {
  getDisplayEnvVars,
  getOmittedEnvVarCount,
  MAX_RENDERED_ENV_VARS
} from "../../../src/core/envVars/display.js";
import type { EnvVar } from "../../../src/schemas/analysis.js";

function createEnvVars(count: number): EnvVar[] {
  return Array.from({ length: count }, (_, index) => ({
    name: `ENV_${index + 1}`,
    sourceFile: "src/config.ts",
    confidence: "medium"
  }));
}

describe("env var display helpers", () => {
  it("limits rendered env vars to the summary maximum", () => {
    const envVars = createEnvVars(MAX_RENDERED_ENV_VARS + 2);

    expect(getDisplayEnvVars(envVars)).toHaveLength(MAX_RENDERED_ENV_VARS);
    expect(getDisplayEnvVars(envVars).at(-1)?.name).toBe(`ENV_${MAX_RENDERED_ENV_VARS}`);
    expect(getOmittedEnvVarCount(envVars)).toBe(2);
  });

  it("does not report omitted env vars when the list fits", () => {
    const envVars = createEnvVars(2);

    expect(getDisplayEnvVars(envVars)).toEqual(envVars);
    expect(getOmittedEnvVarCount(envVars)).toBe(0);
  });
});
