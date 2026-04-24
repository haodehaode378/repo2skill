import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadBenchmarkManifest } from "../../../src/core/benchmarks/loadBenchmarkManifest.js";

describe("loadBenchmarkManifest", () => {
  it("loads and validates the benchmark manifest", async () => {
    const manifest = await loadBenchmarkManifest(
      path.resolve("benchmarks/public-node-ts.json")
    );

    expect(manifest.name).toBe("public-node-ts");
    expect(manifest.repos.length).toBeGreaterThan(0);
    expect(manifest.repos[0]).toEqual({
      name: "hello-world",
      url: "https://github.com/octocat/Hello-World",
      branch: "master"
    });
  });
});
