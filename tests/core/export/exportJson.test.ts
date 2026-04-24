import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import { exportJson } from "../../../src/core/export/exportJson.js";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";

const tempDirs: string[] = [];

function createAnalysis(): RepoAnalysis {
  return {
    repo: {
      input: "./tests/fixtures/demo-repo",
      rootDir: "/tmp/demo-repo",
      name: "demo-repo"
    },
    detected: {
      packageManager: "pnpm",
      scripts: [
        {
          name: "dev",
          command: "vite",
          confidence: "high"
        }
      ],
      entrypoints: [],
      envVars: []
    },
    evidence: [
      {
        claim: "packageManager=pnpm",
        sourceFile: "pnpm-lock.yaml",
        confidence: "high"
      }
    ]
  };
}

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo2skill-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

describe("exportJson", () => {
  it("writes repo2skill.json and creates the output directory", async () => {
    const outDir = path.join(await createTempDir(), "nested", "out");
    const analysis = createAnalysis();

    await exportJson(outDir, analysis);

    const outputPath = path.join(outDir, "repo2skill.json");
    const exists = await fs.pathExists(outputPath);
    const writtenJson = await fs.readJson(outputPath);
    const writtenText = await fs.readFile(outputPath, "utf8");

    expect(exists).toBe(true);
    expect(writtenJson).toEqual(analysis);
    expect(writtenText).toContain('\n  "repo":');
  });

  it("rejects invalid analysis before writing", async () => {
    const outDir = await createTempDir();
    const invalidAnalysis = {
      repo: {
        input: "./tests/fixtures/demo-repo",
        rootDir: "/tmp/demo-repo",
        name: "demo-repo"
      },
      detected: {
        scripts: [],
        entrypoints: [],
        envVars: []
      },
      evidence: [
        {
          claim: "packageManager=pnpm",
          sourceFile: "pnpm-lock.yaml",
          confidence: "certain"
        }
      ]
    } as unknown as RepoAnalysis;

    await expect(exportJson(outDir, invalidAnalysis)).rejects.toThrow();
    await expect(
      fs.pathExists(path.join(outDir, "repo2skill.json"))
    ).resolves.toBe(false);
  });
});
