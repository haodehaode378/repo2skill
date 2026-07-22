import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeLocalRepo } from "../../../src/core/run/runLocalAnalysis.js";

describe("analyzeWorkspacePackages", () => {
  it("collects package-local facts with repository-relative paths", async () => {
    const rootDir = path.resolve("tests/fixtures/workspaces/package-facts");
    const analysis = await analyzeLocalRepo(rootDir);
    const packages = analysis.detected.workspace?.packages ?? [];
    const corePackage = packages.find(
      (workspacePackage) => workspacePackage.name === "@fixture/core"
    );
    const webPackage = packages.find(
      (workspacePackage) => workspacePackage.name === "@fixture/web"
    );

    expect(corePackage).toMatchObject({
      path: "packages/core",
      projectType: undefined,
      scripts: [
        { name: "build", command: "tsc -p tsconfig.json", confidence: "high" },
        { name: "test", command: "vitest run", confidence: "high" }
      ],
      entrypoints: ["packages/core/dist/index.js", "packages/core/src/index.ts"],
      configFiles: [
        { path: "packages/core/package.json", type: "package", confidence: "high" },
        { path: "packages/core/tsconfig.json", type: "typescript", confidence: "high" }
      ],
      directories: [
        {
          path: "packages/core/src",
          role: "source",
          source: "packages/core/src/index.ts",
          confidence: "medium"
        }
      ]
    });
    expect(corePackage?.entrypointFacts).toContainEqual({
      path: "packages/core/dist/index.js",
      role: "package-output",
      source: "packages/core/package.json",
      confidence: "high",
      reason: "main"
    });
    expect(corePackage?.envVars).toContainEqual({
      name: "CORE_TOKEN",
      sourceFile: "packages/core/src/config.ts",
      confidence: "medium"
    });
    expect(corePackage?.directories?.map((directory) => directory.path)).not.toContain(
      "packages/core/dist"
    );
    expect(corePackage?.commands).toEqual([
      {
        name: "build",
        role: "build",
        command: "pnpm --filter @fixture/core build",
        rawScript: "tsc -p tsconfig.json",
        cwd: ".",
        packageName: "@fixture/core",
        packagePath: "packages/core",
        source: "packages/core/package.json",
        confidence: "high",
        scoped: true
      },
      {
        name: "test",
        role: "test",
        command: "pnpm --filter @fixture/core test",
        rawScript: "vitest run",
        cwd: ".",
        packageName: "@fixture/core",
        packagePath: "packages/core",
        source: "packages/core/package.json",
        confidence: "high",
        scoped: true
      }
    ]);
    expect(webPackage).toMatchObject({
      path: "apps/web",
      projectType: "vite",
      entrypoints: ["apps/web/src/main.ts"]
    });
    expect(JSON.stringify(packages)).not.toContain(rootDir);
    expect(analysis.evidence).toContainEqual({
      claim: "workspacePackage[packages/core].entrypoint=src/index.ts",
      sourceFile: "packages/core/src/index.ts",
      confidence: "medium"
    });
  });

  it("keeps a single-package repository compatible", async () => {
    const rootDir = path.resolve("tests/fixtures/analysis-target");
    const analysis = await analyzeLocalRepo(rootDir);

    expect(analysis.detected.workspace).toBeUndefined();
  });
});
