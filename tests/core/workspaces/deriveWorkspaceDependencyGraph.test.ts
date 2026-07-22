import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeLocalRepo } from "../../../src/core/run/runLocalAnalysis.js";

describe("deriveWorkspaceDependencyGraph", () => {
  it("derives typed internal edges and direct package relationships", async () => {
    const rootDir = path.resolve("tests/fixtures/workspaces/internal-dependencies");
    const analysis = await analyzeLocalRepo(rootDir);
    const workspace = analysis.detected.workspace;

    expect(workspace?.dependencyEdges).toEqual([
      {
        sourcePackagePath: "apps/cli",
        sourcePackageName: "@fixture/cli",
        targetPackagePath: "apps/web",
        targetPackageName: "@fixture/web",
        dependencyType: "optionalDependency",
        sourceFile: "apps/cli/package.json",
        confidence: "high"
      },
      {
        sourcePackagePath: "apps/cli",
        sourcePackageName: "@fixture/cli",
        targetPackagePath: "packages/core",
        targetPackageName: "@fixture/core",
        dependencyType: "peerDependency",
        sourceFile: "apps/cli/package.json",
        confidence: "high"
      },
      {
        sourcePackagePath: "apps/web",
        sourcePackageName: "@fixture/web",
        targetPackagePath: "packages/core",
        targetPackageName: "@fixture/core",
        dependencyType: "dependency",
        sourceFile: "apps/web/package.json",
        confidence: "high"
      },
      {
        sourcePackagePath: "apps/web",
        sourcePackageName: "@fixture/web",
        targetPackagePath: "packages/core",
        targetPackageName: "@fixture/core",
        dependencyType: "devDependency",
        sourceFile: "apps/web/package.json",
        confidence: "high"
      }
    ]);

    const corePackage = workspace?.packages?.find(
      (workspacePackage) => workspacePackage.name === "@fixture/core"
    );
    const webPackage = workspace?.packages?.find(
      (workspacePackage) => workspacePackage.name === "@fixture/web"
    );
    const unnamedPackage = workspace?.packages?.find(
      (workspacePackage) => workspacePackage.path === "packages/unnamed"
    );

    expect(corePackage?.directConsumers).toEqual([
      { path: "apps/cli", name: "@fixture/cli" },
      { path: "apps/web", name: "@fixture/web" }
    ]);
    expect(webPackage?.directDependencies).toEqual([
      { path: "packages/core", name: "@fixture/core" }
    ]);
    expect(unnamedPackage?.directDependencies).toEqual([]);
    expect(unnamedPackage?.directConsumers).toEqual([]);
    expect(workspace?.dependencyEdges?.map((edge) => edge.targetPackageName)).not.toContain(
      "external-package"
    );
  });

  it("reports duplicate package names and refuses ambiguous edges", async () => {
    const rootDir = path.resolve("tests/fixtures/workspaces/internal-dependencies");
    const analysis = await analyzeLocalRepo(rootDir);
    const workspace = analysis.detected.workspace;

    expect(workspace?.diagnostics).toEqual([
      {
        code: "duplicate-package-name",
        message: "Workspace package name @fixture/duplicate is declared by multiple paths",
        packagePaths: ["packages/duplicate-a", "packages/duplicate-b"],
        sourceFiles: ["packages/duplicate-a/package.json", "packages/duplicate-b/package.json"],
        confidence: "high"
      }
    ]);
    expect(
      workspace?.dependencyEdges?.some((edge) => edge.targetPackageName === "@fixture/duplicate")
    ).toBe(false);
  });
});
