import { describe, expect, it } from "vitest";
import { EvaluationManifestSchema } from "../../src/schemas/evaluation.js";

describe("EvaluationManifestSchema", () => {
  it("keeps artifact-only manifests compatible", () => {
    const manifest = EvaluationManifestSchema.parse({
      name: "legacy",
      cases: [
        {
          name: "artifact-only",
          input: ".",
          assertions: [{ artifact: "AGENTS.md", includes: ["src"], excludes: [] }]
        }
      ]
    });

    expect(manifest.cases[0]?.facts).toBeUndefined();
  });

  it("accepts semantic fact-only cases", () => {
    const manifest = EvaluationManifestSchema.parse({
      name: "facts",
      cases: [
        {
          name: "entrypoints",
          input: ".",
          facts: { expectedEntrypoints: ["src/cli/index.ts"] }
        }
      ]
    });

    expect(manifest.cases[0]?.assertions).toEqual([]);
    expect(manifest.cases[0]?.facts?.expectedEntrypoints).toEqual(["src/cli/index.ts"]);
  });

  it("accepts workspace graph, package command, and focus assertions", () => {
    const manifest = EvaluationManifestSchema.parse({
      name: "workspace-facts",
      cases: [
        {
          name: "focused-package",
          input: ".",
          package: ".\\packages\\core\\",
          facts: {
            expectedWorkspacePackages: ["@fixture/core"],
            expectedInternalDependencies: [
              {
                sourcePackage: "@fixture/web",
                targetPackage: "@fixture/core",
                dependencyType: "dependency"
              }
            ],
            expectedPackageCommands: [
              {
                package: "@fixture/core",
                command: "pnpm --filter @fixture/core test",
                cwd: "."
              }
            ],
            expectedPackageEntrypoints: [
              { package: "@fixture/core", path: "packages/core/src/index.ts" }
            ],
            expectedFocusedPackage: "@fixture/core"
          }
        }
      ]
    });

    expect(manifest.cases[0]?.package).toBe(".\\packages\\core\\");
    expect(manifest.cases[0]?.facts?.expectedInternalDependencies).toHaveLength(1);
  });

  it("rejects cases without any quality assertion", () => {
    expect(() =>
      EvaluationManifestSchema.parse({
        name: "empty",
        cases: [{ name: "empty", input: "." }]
      })
    ).toThrow("Each evaluation case must contain artifact or semantic fact assertions");
  });
});
