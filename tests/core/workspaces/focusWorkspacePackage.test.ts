import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeLocalRepo } from "../../../src/core/run/runLocalAnalysis.js";
import {
  focusWorkspacePackage,
  normalizePackageSelector
} from "../../../src/core/workspaces/focusWorkspacePackage.js";

describe("focusWorkspacePackage", () => {
  it("focuses by package name and keeps direct dependencies and consumers", async () => {
    const analysis = await analyzeLocalRepo(
      path.resolve("tests/fixtures/workspaces/internal-dependencies")
    );
    const focused = focusWorkspacePackage(analysis, "@fixture/web");

    expect(focused.detected.workspace?.focusedPackage).toEqual({
      path: "apps/web",
      name: "@fixture/web"
    });
    expect(
      focused.detected.workspace?.packages?.map((workspacePackage) => workspacePackage.path)
    ).toEqual(["apps/cli", "apps/web", "packages/core"]);
    expect(focused.detected.workspace?.dependencyEdges).toHaveLength(4);
    expect(JSON.stringify(focused)).not.toContain("packages/unnamed");
    expect(JSON.stringify(focused)).not.toContain("packages/duplicate-a");
    expect(focused.repo).toEqual(analysis.repo);
  });

  it("normalizes a Windows package path selector", async () => {
    const analysis = await analyzeLocalRepo(
      path.resolve("tests/fixtures/workspaces/internal-dependencies")
    );
    const focused = focusWorkspacePackage(analysis, ".\\packages\\core\\");

    expect(focused.detected.workspace?.focusedPackage).toEqual({
      path: "packages/core",
      name: "@fixture/core"
    });
    expect(normalizePackageSelector(".\\packages\\core\\")).toBe("packages/core");
  });

  it("removes facts owned by packages outside the focused neighborhood", async () => {
    const analysis = await analyzeLocalRepo(
      path.resolve("tests/fixtures/workspaces/package-facts")
    );
    const focused = focusWorkspacePackage(analysis, "@fixture/core");

    expect(
      focused.detected.workspace?.packages?.map((workspacePackage) => workspacePackage.path)
    ).toEqual(["packages/core"]);
    expect(focused.detected.envVars.map((envVar) => envVar.name)).toEqual(["CORE_TOKEN"]);
    expect(JSON.stringify(focused.evidence)).not.toContain("WEB_TOKEN");
  });

  it("rejects ambiguous duplicate package names with candidates", async () => {
    const analysis = await analyzeLocalRepo(
      path.resolve("tests/fixtures/workspaces/internal-dependencies")
    );

    expect(() => focusWorkspacePackage(analysis, "@fixture/duplicate")).toThrow(
      "Candidates: @fixture/duplicate (packages/duplicate-a), @fixture/duplicate (packages/duplicate-b)"
    );
  });

  it("rejects unknown packages with the available package inventory", async () => {
    const analysis = await analyzeLocalRepo(
      path.resolve("tests/fixtures/workspaces/internal-dependencies")
    );

    expect(() => focusWorkspacePackage(analysis, "@fixture/missing")).toThrow(
      'Workspace package "@fixture/missing" was not found. Available packages:'
    );
  });

  it("rejects --package for a single-package repository", async () => {
    const analysis = await analyzeLocalRepo(path.resolve("tests/fixtures/analysis-target"));

    expect(() => focusWorkspacePackage(analysis, "analysis-target")).toThrow(
      "--package requires a repository with discovered workspace packages"
    );
  });
});
