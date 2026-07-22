import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { renderAgentsMd } from "../../../src/core/export/exportAgentsMd.js";
import { renderHtmlReport } from "../../../src/core/export/exportHtmlReport.js";
import { renderMaintenanceProfile } from "../../../src/core/export/exportMaintenanceProfile.js";
import { renderProjectMap } from "../../../src/core/export/exportProjectMap.js";
import { renderQuickstart } from "../../../src/core/export/exportQuickstarts.js";
import { renderSkillMd } from "../../../src/core/export/exportSkillMd.js";
import { analyzeLocalRepo } from "../../../src/core/run/runLocalAnalysis.js";
import { focusWorkspacePackage } from "../../../src/core/workspaces/focusWorkspacePackage.js";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";

describe("workspace-aware exporters", () => {
  let packageFacts: RepoAnalysis;
  let dependencyGraph: RepoAnalysis;

  beforeAll(async () => {
    packageFacts = await analyzeLocalRepo(path.resolve("tests/fixtures/workspaces/package-facts"));
    dependencyGraph = await analyzeLocalRepo(
      path.resolve("tests/fixtures/workspaces/internal-dependencies")
    );
  });

  it("renders package facts and dependency topology in the project map", () => {
    const factsMarkdown = renderProjectMap(packageFacts);
    const graphMarkdown = renderProjectMap(dependencyGraph);

    expect(factsMarkdown).toContain("### Workspace Packages");
    expect(factsMarkdown).toContain("`@fixture/core`");
    expect(factsMarkdown).toContain("`packages/core/src/index.ts`");
    expect(factsMarkdown).toContain("`pnpm --filter @fixture/core test`");
    expect(graphMarkdown).toContain("- `@fixture/web` -> `@fixture/core` (dependency)");
    expect(graphMarkdown).toContain("```mermaid");
  });

  it("renders package-specific editing and validation guidance in AGENTS.md", () => {
    const markdown = renderAgentsMd(packageFacts);

    expect(markdown).toContain("## Package-Specific Guidance");
    expect(markdown).toContain("### @fixture/core");
    expect(markdown).toContain(
      "Before editing configuration, inspect: `packages/core/package.json`, `packages/core/tsconfig.json`"
    );
    expect(markdown).toContain(
      "Package validation: `pnpm --filter @fixture/core test`, `pnpm --filter @fixture/core build`"
    );
    expect(markdown).toContain(
      "Use root validation for shared/root configuration changes; use package validation for isolated package changes."
    );
  });

  it("renders focused package context and package references in SKILL.md", () => {
    const focused = focusWorkspacePackage(packageFacts, "@fixture/core");
    const markdown = renderSkillMd(focused);

    expect(markdown).toContain("## Workspace Package Context");
    expect(markdown).toContain("Focused package: `@fixture/core` at `packages/core`");
    expect(markdown).toContain("test command: `pnpm --filter @fixture/core test` (cwd: `.`)");
  });

  it("ranks package impact only by direct consumer count", () => {
    const markdown = renderMaintenanceProfile(dependencyGraph);

    expect(markdown).toContain("## Workspace Package Inventory");
    expect(markdown).toContain("### Packages by Direct Consumer Count");
    expect(markdown).toContain("`@fixture/core`: 2 direct consumers.");
    expect(markdown).toContain("`@fixture/web`: 1 direct consumer.");
  });

  it("renders package-manager-aware package commands in quickstarts", () => {
    const markdown = renderQuickstart(packageFacts, {
      fileName: "quickstart.windows.md",
      title: "Windows Quickstart",
      shellLabel: "powershell"
    });

    expect(markdown).toContain("## Workspace Package Commands");
    expect(markdown).toContain("### @fixture/core");
    expect(markdown).toContain("pnpm --filter @fixture/core test");
  });

  it("renders a self-contained HTML workspace package report", () => {
    const focused = focusWorkspacePackage(dependencyGraph, "@fixture/web");
    const html = renderHtmlReport(focused);

    expect(html).toContain("<h2>Workspace Packages</h2>");
    expect(html).toContain("<strong>Focused package:</strong>");
    expect(html).toContain("@fixture/web");
    expect(html).toContain("Internal Dependencies");
    expect(html).toContain("@fixture/core");
    expect(html).not.toMatch(/<script|https?:\/\//);
  });
});
