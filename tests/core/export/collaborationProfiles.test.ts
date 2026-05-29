import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderCourseProjectReport } from "../../../src/core/export/exportCourseProjectReport.js";
import { renderDemoScreenshotPlan } from "../../../src/core/export/exportDemoScreenshotPlan.js";
import { renderIssueToPrPlan } from "../../../src/core/export/exportIssueToPrPlan.js";
import { renderReleaseCheck } from "../../../src/core/export/exportReleaseCheck.js";
import { analyzeLocalRepo } from "../../../src/core/run/runLocalAnalysis.js";

describe("collaboration profile renderers", () => {
  it("renders an evidence-backed release check", async () => {
    const analysis = await analyzeLocalRepo(path.resolve("tests/fixtures/collaboration-target"));

    const markdown = renderReleaseCheck(analysis);

    expect(markdown).toContain("# GitHub Release Check");
    expect(markdown).toContain("| Repository basics | README | PASS | `README.md` (high) |");
    expect(markdown).toContain(
      "| Build and validation | test command | PASS | `npm run test` from package.json |"
    );
    expect(markdown).toContain(
      "| Version and release notes | version source | PASS | package.json version `1.2.3` |"
    );
    expect(markdown).toContain(
      "| Safety and maintainability | code of conduct | WARN | No code of conduct evidence was detected. |"
    );
  });

  it("renders a course project report scaffold", async () => {
    const analysis = await analyzeLocalRepo(path.resolve("tests/fixtures/collaboration-target"));

    const markdown = renderCourseProjectReport(analysis);

    expect(markdown).toContain("# Course Project Report Draft");
    expect(markdown).toContain("- Candidate: `collaboration-target`");
    expect(markdown).toContain("- Install: `npm install`");
    expect(markdown).toContain("`src/pages` (route candidate)");
    expect(markdown).toContain("Terminal: validation output for `npm run test`.");
  });

  it("renders a demo screenshot plan without claiming captures exist", async () => {
    const analysis = await analyzeLocalRepo(path.resolve("tests/fixtures/collaboration-target"));

    const markdown = renderDemoScreenshotPlan(analysis);

    expect(markdown).toContain("# Demo Screenshot Plan");
    expect(markdown).toContain("This plan lists captures to take manually.");
    expect(markdown).toContain("`01-startup.png`: terminal output for `npm run dev`.");
    expect(markdown).toContain("screen for route/page evidence `src/pages`");
  });

  it("renders an issue-to-pr plan from issue text", async () => {
    const analysis = await analyzeLocalRepo(path.resolve("tests/fixtures/collaboration-target"));

    const markdown = renderIssueToPrPlan(analysis, "Fix the login page validation.");

    expect(markdown).toContain("# Issue To PR Plan");
    expect(markdown).toContain("Fix the login page validation.");
    expect(markdown).toContain("## Acceptance Criteria");
    expect(markdown).toContain("`npm run test` (test) from package.json");
  });
});
