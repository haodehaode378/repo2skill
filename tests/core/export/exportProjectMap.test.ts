import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import {
  exportProjectMap,
  renderProjectMap
} from "../../../src/core/export/exportProjectMap.js";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";

const tempDirs: string[] = [];

function createFullAnalysis(): RepoAnalysis {
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
        },
        {
          name: "test",
          command: "vitest run",
          confidence: "high"
        }
      ],
      entrypoints: ["src/main.ts", "src/server.ts"],
      envVars: [
        {
          name: "API_URL",
          sourceFile: ".env.example",
          confidence: "high"
        }
      ]
    },
    evidence: []
  };
}

function createMinimalAnalysis(): RepoAnalysis {
  return {
    repo: {
      input: "./fixture",
      rootDir: "/tmp/fixture",
      name: "fixture"
    },
    detected: {
      scripts: [],
      entrypoints: [],
      envVars: []
    },
    evidence: []
  };
}

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo2skill-project-map-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

describe("renderProjectMap", () => {
  it("renders all populated sections from analysis data", () => {
    const markdown = renderProjectMap(createFullAnalysis());

    expect(markdown).toContain("## Repository Overview");
    expect(markdown).toContain("- Name: `repo`");
    expect(markdown).toContain("## Detected Package Manager");
    expect(markdown).toContain("- `pnpm`");
    expect(markdown).toContain("## Project Type");
    expect(markdown).toContain("- `vite`");
    expect(markdown).toContain("- `dev`: `vite`");
    expect(markdown).toContain("- `src/main.ts`");
    expect(markdown).toContain("- `API_URL` from `.env.example` (high)");
  });

  it("omits sections that lack supporting analysis data", () => {
    const markdown = renderProjectMap(createMinimalAnalysis());

    expect(markdown).toContain("## Repository Overview");
    expect(markdown).not.toContain("## Detected Package Manager");
    expect(markdown).not.toContain("## Project Type");
    expect(markdown).not.toContain("## Key Scripts");
    expect(markdown).not.toContain("## Entrypoints");
    expect(markdown).not.toContain("## Environment Variables");
  });
});

describe("exportProjectMap", () => {
  it("writes project-map.md to the output directory", async () => {
    const outDir = path.join(await createTempDir(), "nested", "out");

    await exportProjectMap(outDir, createFullAnalysis());

    const outputPath = path.join(outDir, "project-map.md");

    await expect(fs.pathExists(outputPath)).resolves.toBe(true);
    await expect(fs.readFile(outputPath, "utf8")).resolves.toContain("## Key Scripts");
  });

  it("rejects invalid analysis before writing", async () => {
    const outDir = await createTempDir();
    const invalidAnalysis = {
      repo: {
        input: "./fixture",
        rootDir: "/tmp/fixture",
        name: "fixture"
      },
      detected: {
        scripts: [],
        entrypoints: [],
        envVars: [
          {
            name: "API_URL",
            sourceFile: ".env.example",
            confidence: "certain"
          }
        ]
      },
      evidence: []
    } as unknown as RepoAnalysis;

    await expect(exportProjectMap(outDir, invalidAnalysis)).rejects.toThrow();
    await expect(fs.pathExists(path.join(outDir, "project-map.md"))).resolves.toBe(false);
  });
});
