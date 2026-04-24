import { describe, expect, it } from "vitest";
import { RepoAnalysisSchema } from "../../src/schemas/analysis.js";

describe("RepoAnalysisSchema", () => {
  it("accepts the minimal valid analysis shape", () => {
    const result = RepoAnalysisSchema.parse({
      repo: {
        input: "./tests/fixtures/demo-repo",
        rootDir: "/tmp/demo-repo",
        name: "demo-repo"
      },
      detected: {
        scripts: [],
        entrypoints: [],
        envVars: []
      },
      evidence: []
    });

    expect(result.repo.name).toBe("demo-repo");
  });

  it("rejects an invalid confidence level", () => {
    expect(() =>
      RepoAnalysisSchema.parse({
        repo: {
          input: "./tests/fixtures/demo-repo",
          rootDir: "/tmp/demo-repo",
          name: "demo-repo"
        },
        detected: {
          scripts: [],
          entrypoints: [],
          envVars: []
        },
        evidence: [
          {
            claim: "packageManager=pnpm",
            sourceFile: "pnpm-lock.yaml",
            confidence: "certain"
          }
        ]
      })
    ).toThrow();
  });
});
