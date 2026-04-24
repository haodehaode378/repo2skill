import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import {
  analyzeLocalRepo,
  exportAnalysisArtifacts,
  renderAnalysisSummary
} from "../../../src/core/run/runLocalAnalysis.js";

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo2skill-run-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

describe("analyzeLocalRepo", () => {
  it("builds analysis from the implemented detectors", async () => {
    const rootDir = path.resolve("tests/fixtures/analysis-target");

    const analysis = await analyzeLocalRepo(rootDir);

    expect(analysis.repo).toEqual({
      input: rootDir,
      rootDir,
      name: "analysis-target"
    });
    expect(analysis.detected.packageManager).toBe("pnpm");
    expect(analysis.detected.projectType).toBe("vite");
    expect(analysis.detected.scripts).toEqual([
      {
        name: "dev",
        command: "vite",
        confidence: "high"
      },
      {
        name: "build",
        command: "vite build",
        confidence: "high"
      },
      {
        name: "test",
        command: "vitest run",
        confidence: "high"
      }
    ]);
    expect(analysis.detected.commands).toEqual([
      {
        name: "dev",
        role: "dev",
        command: "pnpm dev",
        rawScript: "vite",
        source: "package.json",
        confidence: "high"
      },
      {
        name: "build",
        role: "build",
        command: "pnpm build",
        rawScript: "vite build",
        source: "package.json",
        confidence: "high"
      },
      {
        name: "test",
        role: "test",
        command: "pnpm test",
        rawScript: "vitest run",
        source: "package.json",
        confidence: "high"
      }
    ]);
    expect(analysis.detected.entrypoints).toEqual(["src/main.ts"]);
    expect(analysis.detected.directories).toEqual([
      {
        path: "src",
        role: "source",
        source: "src/main.ts",
        confidence: "medium"
      }
    ]);
    expect(analysis.detected.configFiles).toEqual([
      {
        path: ".env.example",
        type: "environment",
        confidence: "high"
      },
      {
        path: "package.json",
        type: "package",
        confidence: "high"
      },
      {
        path: "vite.config.ts",
        type: "framework",
        confidence: "high"
      }
    ]);
    expect(analysis.detected.envVars).toEqual([
      {
        name: "API_URL",
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
});

describe("exportAnalysisArtifacts", () => {
  it("writes both supported outputs for the all format", async () => {
    const outDir = await createTempDir();
    const analysis = await analyzeLocalRepo(path.resolve("tests/fixtures/analysis-target"));

    const writtenFiles = await exportAnalysisArtifacts(outDir, analysis, "all");

    expect(writtenFiles).toEqual([
      path.join(outDir, "repo2skill.json"),
      path.join(outDir, "project-map.md"),
      path.join(outDir, "AGENTS.md"),
      path.join(outDir, "SKILL.md"),
      path.join(outDir, "quickstart.windows.md"),
      path.join(outDir, "quickstart.macos.md"),
      path.join(outDir, "quickstart.linux.md"),
      path.join(outDir, "report.html")
    ]);
    await expect(fs.pathExists(path.join(outDir, "repo2skill.json"))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(outDir, "project-map.md"))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(outDir, "AGENTS.md"))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(outDir, "SKILL.md"))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(outDir, "quickstart.windows.md"))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(outDir, "quickstart.macos.md"))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(outDir, "quickstart.linux.md"))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(outDir, "report.html"))).resolves.toBe(true);
  });

  it("writes only markdown output for the md format", async () => {
    const outDir = await createTempDir();
    const analysis = await analyzeLocalRepo(path.resolve("tests/fixtures/analysis-target"));

    const writtenFiles = await exportAnalysisArtifacts(outDir, analysis, "md");

    expect(writtenFiles).toEqual([
      path.join(outDir, "project-map.md"),
      path.join(outDir, "AGENTS.md"),
      path.join(outDir, "SKILL.md"),
      path.join(outDir, "quickstart.windows.md"),
      path.join(outDir, "quickstart.macos.md"),
      path.join(outDir, "quickstart.linux.md")
    ]);
    await expect(fs.pathExists(path.join(outDir, "repo2skill.json"))).resolves.toBe(false);
    await expect(fs.pathExists(path.join(outDir, "project-map.md"))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(outDir, "AGENTS.md"))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(outDir, "SKILL.md"))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(outDir, "quickstart.windows.md"))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(outDir, "quickstart.macos.md"))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(outDir, "quickstart.linux.md"))).resolves.toBe(true);
  });
});

describe("renderAnalysisSummary", () => {
  it("renders a concise summary from analysis data and written files", async () => {
    const analysis = await analyzeLocalRepo(path.resolve("tests/fixtures/analysis-target"));
    const writtenFiles = [
      "out/repo2skill.json",
      "out/project-map.md",
      "out/AGENTS.md",
      "out/SKILL.md",
      "out/quickstart.windows.md",
      "out/quickstart.macos.md",
      "out/quickstart.linux.md",
      "out/report.html"
    ];

    const summary = renderAnalysisSummary(analysis, writtenFiles, {
      inputSource: "https://github.com/example/repo",
      materializedRootDir: analysis.repo.rootDir
    });

    expect(summary).toContain("Repository input: https://github.com/example/repo");
    expect(summary).toContain(`Materialized root: ${analysis.repo.rootDir}`);
    expect(summary).toContain("Package manager: pnpm");
    expect(summary).toContain("Project type: vite");
    expect(summary).toContain("Scripts: dev, build, test");
    expect(summary).toContain("Entrypoints: src/main.ts");
    expect(summary).toContain("Environment variables: API_URL (high), SECRET_TOKEN (medium)");
    expect(summary).toContain("Generated files:");
    expect(summary).toContain("- out/AGENTS.md");
    expect(summary).toContain("- out/quickstart.windows.md");
    expect(summary).toContain("- out/report.html");
  });

  it("omits the generated files section when nothing was written", async () => {
    const analysis = await analyzeLocalRepo(path.resolve("tests/fixtures/analysis-target"));

    const summary = renderAnalysisSummary(analysis, [], {
      inputSource: analysis.repo.input,
      materializedRootDir: analysis.repo.rootDir
    });

    expect(summary).not.toContain("Generated files:");
  });
});
