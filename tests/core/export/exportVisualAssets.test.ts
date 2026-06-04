import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import {
  createVisualAssetSpecs,
  createVisualBrief,
  exportVisualAssets,
  renderVisualPrompts,
  renderVisualReview
} from "../../../src/core/export/exportVisualAssets.js";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";

const tempDirs: string[] = [];

function createAnalysis(): RepoAnalysis {
  return {
    repo: {
      input: "E:/local/user/repo",
      rootDir: "E:/local/user/repo",
      name: "repo"
    },
    detected: {
      packageManager: "pnpm",
      projectType: "vite",
      scripts: [],
      commands: [
        {
          name: "test",
          role: "test",
          command: "pnpm test",
          rawScript: "vitest run",
          source: "package.json",
          confidence: "high"
        }
      ],
      directories: [
        {
          path: "src",
          role: "source",
          source: "src/main.ts",
          confidence: "medium"
        }
      ],
      configFiles: [
        {
          path: "package.json",
          type: "package",
          confidence: "high"
        }
      ],
      entrypoints: ["src/main.ts"],
      entrypointFacts: [
        {
          path: "src/main.ts",
          role: "source",
          source: "src/main.ts",
          confidence: "medium"
        }
      ],
      envVars: [
        {
          name: "SECRET_TOKEN",
          sourceFile: "src/config.ts",
          confidence: "medium"
        }
      ],
      docs: [],
      demoSignals: [],
      auditFindings: [
        {
          category: "secret",
          severity: "high",
          path: "src/config.ts",
          message: "possible secret assignment",
          evidence: "abcDEF1234567890abcDEF1234567890"
        }
      ]
    },
    evidence: []
  };
}

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo2skill-visual-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

describe("visual asset generation", () => {
  it("creates a visual brief and evidenced asset specs", () => {
    const analysis = createAnalysis();
    const brief = createVisualBrief(analysis);
    const assets = createVisualAssetSpecs(analysis, brief);
    const prompts = renderVisualPrompts(brief, assets);
    const review = renderVisualReview(analysis, assets);

    expect(brief.projectName).toBe("repo");
    expect(brief.projectType).toBe("vite");
    expect(brief.packageManager).toBe("pnpm");
    expect(assets.map((asset) => asset.kind)).toEqual([
      "readme-hero",
      "skill-card",
      "architecture-poster"
    ]);
    expect(assets.every((asset) => asset.evidenceRefs.length > 0)).toBe(true);
    expect(prompts).toContain("## README Hero");
    expect(prompts).toContain("## Skill Card");
    expect(prompts).toContain("## Architecture Poster");
    expect(prompts).not.toContain("E:/local/user/repo");
    expect(prompts).not.toContain("abcDEF1234567890abcDEF1234567890");
    expect(review).toContain("High-severity audit findings were detected");
  });

  it("writes the visual prompt pack files", async () => {
    const outDir = await createTempDir();

    const writtenFiles = await exportVisualAssets(outDir, createAnalysis(), {
      assets: ["readme-hero"],
      generatedAt: "2026-06-04T00:00:00.000Z"
    });

    expect(writtenFiles).toEqual([
      path.join(outDir, "visual", "visual-brief.json"),
      path.join(outDir, "visual", "visual-prompts.md"),
      path.join(outDir, "visual", "asset-manifest.json"),
      path.join(outDir, "visual", "visual-review.md")
    ]);

    const manifest = await fs.readJson(path.join(outDir, "visual", "asset-manifest.json"));

    expect(manifest.mode).toBe("prompts");
    expect(manifest.generatedAt).toBe("2026-06-04T00:00:00.000Z");
    expect(manifest.assets).toHaveLength(1);
    expect(manifest.assets[0].kind).toBe("readme-hero");
    await expect(fs.pathExists(path.join(outDir, "visual", "visual-prompts.md"))).resolves.toBe(
      true
    );
  });
});
