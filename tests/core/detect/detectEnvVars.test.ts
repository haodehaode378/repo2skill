import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectEnvVars } from "../../../src/core/detect/detectEnvVars.js";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";

function createAnalysis(): RepoAnalysis {
  return {
    repo: {
      input: "./tests/fixtures/env-vars",
      rootDir: "",
      name: "fixture"
    },
    detected: {
      scripts: [],
      commands: [],
      directories: [],
      configFiles: [],
      entrypoints: [],
      envVars: []
    },
    evidence: []
  };
}

describe("detectEnvVars", () => {
  it("extracts high-confidence env vars from env example files", async () => {
    const analysis = createAnalysis();
    const rootDir = path.resolve("tests/fixtures/env-vars/env-files");

    await detectEnvVars(rootDir, analysis);

    expect(analysis.detected.envVars).toEqual([
      {
        name: "API_URL",
        sourceFile: ".env.example",
        confidence: "high"
      },
      {
        name: "NEXT_PUBLIC_APP_NAME",
        sourceFile: ".env.example",
        confidence: "high"
      },
      {
        name: "LOCAL_ONLY",
        sourceFile: ".env.local.example",
        confidence: "high"
      }
    ]);

    expect(analysis.evidence).toEqual([
      {
        claim: "envVar:API_URL",
        sourceFile: ".env.example",
        confidence: "high"
      },
      {
        claim: "envVar:NEXT_PUBLIC_APP_NAME",
        sourceFile: ".env.example",
        confidence: "high"
      },
      {
        claim: "envVar:LOCAL_ONLY",
        sourceFile: ".env.local.example",
        confidence: "high"
      }
    ]);
  });

  it("extracts medium-confidence env vars from source usage", async () => {
    const analysis = createAnalysis();
    const rootDir = path.resolve("tests/fixtures/env-vars/source-only");

    await detectEnvVars(rootDir, analysis);

    expect(analysis.detected.envVars).toEqual([
      {
        name: "API_URL",
        sourceFile: "src/config.ts",
        confidence: "medium"
      },
      {
        name: "LOG_LEVEL",
        sourceFile: "src/config.ts",
        confidence: "medium"
      },
      {
        name: "APP_MODE",
        sourceFile: "src/config.ts",
        confidence: "medium"
      }
    ]);
  });

  it("prefers env example evidence over source-code evidence for duplicates", async () => {
    const analysis = createAnalysis();
    const rootDir = path.resolve("tests/fixtures/env-vars/mixed");

    await detectEnvVars(rootDir, analysis);

    expect(analysis.detected.envVars).toEqual([
      {
        name: "API_URL",
        sourceFile: ".env.example",
        confidence: "high"
      },
      {
        name: "NEXT_PUBLIC_APP_NAME",
        sourceFile: ".env.example",
        confidence: "high"
      },
      {
        name: "SECRET_TOKEN",
        sourceFile: "src/config.ts",
        confidence: "medium"
      }
    ]);
  });

  it("ignores noisy documentation, test, fixture, and non-source files", async () => {
    const analysis = createAnalysis();
    const rootDir = path.resolve("tests/fixtures/env-vars/noisy");

    await detectEnvVars(rootDir, analysis);

    expect(analysis.detected.envVars).toEqual([
      {
        name: "API_URL",
        sourceFile: "src/config.ts",
        confidence: "medium"
      }
    ]);
  });

  it("does nothing when no env vars are evidenced", async () => {
    const analysis = createAnalysis();
    const rootDir = path.resolve("tests/fixtures/env-vars/empty");

    await detectEnvVars(rootDir, analysis);

    expect(analysis.detected.envVars).toEqual([]);
    expect(analysis.evidence).toEqual([]);
  });
});
