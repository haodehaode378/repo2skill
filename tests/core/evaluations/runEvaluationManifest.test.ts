import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import {
  renderEvaluationSummary,
  runEvaluationManifest
} from "../../../src/core/evaluations/runEvaluationManifest.js";
import { analyzeLocalRepo } from "../../../src/core/run/runLocalAnalysis.js";
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
        expected: "missing fact",
        actual: "absent"
      },
      {
        artifact: "AGENTS.md",
        unexpected: "src/index.ts",
        actual: "present"
      }
    ]);
  });

  it("checks concrete facts that count-only benchmarks cannot distinguish", async () => {
    const outDir = await createTempDir();
    const fixture = path.resolve("tests/fixtures/entrypoints/cli-generated");
    const analysis = await analyzeLocalRepo(fixture);
    const wrongAnalysis = {
      ...analysis,
      detected: {
        ...analysis.detected,
        entrypoints: ["./dist/index.js", "src/cli/wrong.ts"]
      }
    };
    const manifest: EvaluationManifest = {
      name: "semantic-entrypoints",
      cases: [
        {
          name: "same-count-wrong-fact",
          input: fixture,
          assertions: [],
          facts: {
            expectedEntrypoints: ["src/cli/index.ts"],
            forbiddenEntrypoints: [],
            expectedImportantDirectories: [],
            forbiddenImportantDirectories: ["dist"],
            expectedCommands: [],
            expectedConfigFiles: [],
            expectedWorkspacePackages: [],
            forbiddenWorkspacePackages: [],
            expectedWorkspacePackagePaths: [],
            forbiddenWorkspacePackagePaths: [],
            expectedInternalDependencies: [],
            forbiddenInternalDependencies: [],
            expectedPackageCommands: [],
            forbiddenPackageCommands: [],
            expectedPackageEntrypoints: [],
            forbiddenPackageEntrypoints: [],
            expectedPackageImportantDirectories: [],
            forbiddenPackageImportantDirectories: []
          }
        }
      ]
    };

    expect(wrongAnalysis.detected.entrypoints).toHaveLength(analysis.detected.entrypoints.length);

    const summary = await runEvaluationManifest(manifest, {
      outDir,
      analyzeLocalRepoFn: async () => wrongAnalysis
    });

    expect(summary.failureCount).toBe(1);
    expect(summary.results[0]?.failures).toEqual([
      {
        artifact: "facts.entrypoints",
        expected: "src/cli/index.ts",
        actual: "[./dist/index.js, src/cli/wrong.ts]"
      }
    ]);
  });

  it("checks workspace packages, graph facts, commands, and Windows-style focus selectors", async () => {
    const outDir = await createTempDir();
    const manifest: EvaluationManifest = {
      name: "workspace-semantic-facts",
      cases: [
        {
          name: "focused-core",
          input: path.resolve("tests/fixtures/workspaces/package-facts"),
          package: ".\\packages\\core\\",
          assertions: [],
          facts: {
            expectedEntrypoints: [],
            forbiddenEntrypoints: [],
            expectedImportantDirectories: [],
            forbiddenImportantDirectories: [],
            expectedCommands: [],
            expectedConfigFiles: [],
            expectedWorkspacePackages: ["@fixture/core"],
            forbiddenWorkspacePackages: ["@fixture/web"],
            expectedWorkspacePackagePaths: ["packages/core"],
            forbiddenWorkspacePackagePaths: ["apps/web"],
            expectedInternalDependencies: [],
            forbiddenInternalDependencies: [],
            expectedPackageCommands: [
              {
                package: "@fixture/core",
                command: "pnpm --filter @fixture/core test",
                cwd: "."
              }
            ],
            forbiddenPackageCommands: [],
            expectedPackageEntrypoints: [
              { package: "@fixture/core", path: "packages/core/src/index.ts" }
            ],
            forbiddenPackageEntrypoints: [],
            expectedPackageImportantDirectories: [
              { package: "@fixture/core", path: "packages/core/src" }
            ],
            forbiddenPackageImportantDirectories: [],
            expectedFocusedPackage: "@fixture/core"
          }
        }
      ]
    };

    const summary = await runEvaluationManifest(manifest, { outDir });

    expect(summary.failureCount).toBe(0);
    expect(summary.results[0]?.failures).toEqual([]);
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
    expect(text).toContain("expected SKILL.md: pnpm test");
  });
});
