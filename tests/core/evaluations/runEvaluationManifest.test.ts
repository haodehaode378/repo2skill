import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import {
  renderEvaluationSummary,
  runEvaluationManifest
} from "../../../src/core/evaluations/runEvaluationManifest.js";
import type { EvaluationManifest } from "../../../src/schemas/evaluation.js";

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo2skill-eval-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

describe("runEvaluationManifest", () => {
  it("passes when generated artifacts contain expected context facts", async () => {
    const outDir = await createTempDir();
    const manifest: EvaluationManifest = {
      name: "local-entrypoints",
      cases: [
        {
          name: "export-entrypoints",
          input: path.resolve("tests/fixtures/export-entrypoints"),
          assertions: [
            {
              artifact: "SKILL.md",
              includes: [
                "Entrypoint: `./dist/index.js` (package-output, high, main)",
                "Entrypoint: `src/index.ts` (source, medium)",
                "Directory: `src` (source, medium)"
              ],
              excludes: []
            },
            {
              artifact: "AGENTS.md",
              includes: [
                "Start from evidenced directories: `src`.",
                "`./dist/index.js` (package-output, high, main)",
                "`src/index.ts` (source, medium)"
              ],
              excludes: ["- `dist`"]
            }
          ]
        }
      ]
    };

    const summary = await runEvaluationManifest(manifest, { outDir });

    expect(summary).toMatchObject({
      manifestName: "local-entrypoints",
      caseCount: 1,
      successCount: 1,
      failureCount: 0
    });
    expect(summary.results[0]?.failures).toEqual([]);
  });

  it("reports missing or unexpected context facts", async () => {
    const outDir = await createTempDir();
    const manifest: EvaluationManifest = {
      name: "local-entrypoints",
      cases: [
        {
          name: "export-entrypoints",
          input: path.resolve("tests/fixtures/export-entrypoints"),
          assertions: [
            {
              artifact: "AGENTS.md",
              includes: ["missing fact"],
              excludes: ["src/index.ts"]
            }
          ]
        }
      ]
    };

    const summary = await runEvaluationManifest(manifest, { outDir });

    expect(summary.failureCount).toBe(1);
    expect(summary.results[0]?.failures).toEqual([
      {
        artifact: "AGENTS.md",
        expected: "missing fact"
      },
      {
        artifact: "AGENTS.md",
        unexpected: "src/index.ts"
      }
    ]);
  });
});

describe("renderEvaluationSummary", () => {
  it("renders a concise evaluation summary", () => {
    const text = renderEvaluationSummary({
      manifestName: "demo",
      caseCount: 1,
      successCount: 0,
      failureCount: 1,
      results: [
        {
          name: "case-one",
          input: "./fixture",
          success: false,
          outputDir: "out/case-one",
          failureCount: 1,
          failures: [
            {
              artifact: "SKILL.md",
              expected: "pnpm test"
            }
          ]
        }
      ]
    });

    expect(text).toContain("Evaluation manifest: demo");
    expect(text).toContain("- FAIL | case-one | failures=1");
    expect(text).toContain("missing SKILL.md: pnpm test");
  });
});
