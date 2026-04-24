import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import {
  exportHtmlReport,
  renderHtmlReport
} from "../../../src/core/export/exportHtmlReport.js";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";

const tempDirs: string[] = [];

function createAnalysis(): RepoAnalysis {
  return {
    repo: {
      input: "https://github.com/example/repo",
      rootDir: "/tmp/repo",
      name: "repo"
    },
    detected: {
      packageManager: "pnpm",
      projectType: "vite",
      scripts: [
        {
          name: "dev",
          command: "vite",
          confidence: "high"
        }
      ],
      entrypoints: ["src/main.ts"],
      envVars: [
        {
          name: "API_URL",
          sourceFile: ".env.example",
          confidence: "high"
        }
      ]
    },
    evidence: [
      {
        claim: "projectType=vite",
        sourceFile: "vite.config.ts",
        confidence: "high"
      }
    ]
  };
}

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo2skill-report-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

describe("renderHtmlReport", () => {
  it("renders the analysis into HTML sections", () => {
    const html = renderHtmlReport(createAnalysis());

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<h2>Repository Overview</h2>");
    expect(html).toContain("Package Manager:");
    expect(html).toContain("Scripts</h2>");
    expect(html).toContain("Environment Variables</h2>");
    expect(html).toContain("Repository Topology Hints</h2>");
    expect(html).toContain("<code>src</code>");
    expect(html).toContain("Evidence</h2>");
  });
});

describe("exportHtmlReport", () => {
  it("writes report.html to the output directory", async () => {
    const outDir = path.join(await createTempDir(), "nested", "out");

    await exportHtmlReport(outDir, createAnalysis());

    const outputPath = path.join(outDir, "report.html");

    await expect(fs.pathExists(outputPath)).resolves.toBe(true);
    await expect(fs.readFile(outputPath, "utf8")).resolves.toContain("<h1>repo Report</h1>");
  });
});
