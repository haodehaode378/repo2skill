import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadBenchmarkBaseline } from "../../../src/core/benchmarks/loadBenchmarkBaseline.js";

describe("loadBenchmarkBaseline", () => {
  it("loads and validates a benchmark baseline JSON file", async () => {
    const baseline = await loadBenchmarkBaseline(
      path.resolve("benchmarks/baselines/public-node-ts-smoke.summary.json")
    );

    expect(baseline.manifestName).toBe("public-node-ts-smoke");
    expect(baseline.repoCount).toBe(10);
    expect(baseline.successCount).toBe(10);
  });
});
