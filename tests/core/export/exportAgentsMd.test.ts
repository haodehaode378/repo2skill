import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import {
  exportAgentsMd,
  renderAgentsMd
} from "../../../src/core/export/exportAgentsMd.js";
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
        },
        {
          name: "lint",
          command: "eslint .",
          confidence: "high"
        }
      ],
      entrypoints: ["src/main.ts", "src/server.ts", "scripts/build.ts"],
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
        claim: "packageManager=pnpm",
        sourceFile: "pnpm-lock.yaml",
        confidence: "high"
      }
    ]
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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo2skill-agents-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

describe("renderAgentsMd", () => {
  it("renders supported sections from analysis data", () => {
    const markdown = renderAgentsMd(createFullAnalysis());

    expect(markdown).toContain("## Repository Overview");
    expect(markdown).toContain("- Name: `repo`");
    expect(markdown).toContain("- Detected Package Manager: `pnpm`");
    expect(markdown).toContain("## Priority Commands");
    expect(markdown).toContain("- `dev`: `vite`");
    expect(markdown).toContain("## Validation Before Finishing");
    expect(markdown).toContain("- Run `vitest run` via the `test` script.");
    expect(markdown).toContain("- Run `eslint .` via the `lint` script.");
    expect(markdown).toContain("## Important Directories");
    expect(markdown).toContain("- `src`");
    expect(markdown).toContain("- `scripts`");
    expect(markdown).toContain("## Notes and Boundaries");
    expect(markdown).toContain("- Detected environment variables: `API_URL`.");
  });

  it("omits sections without supporting data", () => {
    const markdown = renderAgentsMd(createMinimalAnalysis());

    expect(markdown).toContain("## Repository Overview");
    expect(markdown).not.toContain("## Priority Commands");
    expect(markdown).not.toContain("## Validation Before Finishing");
    expect(markdown).not.toContain("## Important Directories");
    expect(markdown).not.toContain("## Notes and Boundaries");
  });
});

describe("exportAgentsMd", () => {
  it("writes AGENTS.md to the output directory", async () => {
    const outDir = path.join(await createTempDir(), "nested", "out");

    await exportAgentsMd(outDir, createFullAnalysis());

    const outputPath = path.join(outDir, "AGENTS.md");

    await expect(fs.pathExists(outputPath)).resolves.toBe(true);
    await expect(fs.readFile(outputPath, "utf8")).resolves.toContain("## Priority Commands");
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
        scripts: [
          {
            name: "test",
            command: "vitest run",
            confidence: "certain"
          }
        ],
        entrypoints: [],
        envVars: []
      },
      evidence: []
    } as unknown as RepoAnalysis;

    await expect(exportAgentsMd(outDir, invalidAnalysis)).rejects.toThrow();
    await expect(fs.pathExists(path.join(outDir, "AGENTS.md"))).resolves.toBe(false);
  });
});
