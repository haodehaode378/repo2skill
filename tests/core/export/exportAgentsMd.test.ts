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
      workspace: {
        isWorkspace: true,
        packageGlobs: ["apps/*", "packages/*"],
        signals: ["pnpm-workspace.yaml"],
        confidence: "high"
      },
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
      commands: [],
      directories: [],
      configFiles: [
        {
          path: "vite.config.ts",
          type: "framework",
          confidence: "high"
        }
      ],
      entrypoints: ["./dist/index.js", "src/main.ts", "src/server.ts", "scripts/build.ts"],
      entrypointFacts: [
        {
          path: "./dist/index.js",
          role: "package-output",
          source: "package.json",
          confidence: "high",
          reason: "main"
        },
        {
          path: "src/main.ts",
          role: "source",
          source: "src/main.ts",
          confidence: "medium"
        },
        {
          path: "src/server.ts",
          role: "source",
          source: "src/server.ts",
          confidence: "medium"
        },
        {
          path: "scripts/build.ts",
          role: "cli",
          source: "package.json",
          confidence: "high",
          reason: "bin"
        }
      ],
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
      commands: [],
      directories: [],
      configFiles: [],
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
    expect(markdown).toContain("- `dev`: `pnpm dev` (script: `vite`)");
    expect(markdown).toContain("## Before Changing Code");
    expect(markdown).toContain("- Review relevant config first: `vite.config.ts`.");
    expect(markdown).toContain("- Start from evidenced directories: `src`, `scripts`.");
    expect(markdown).toContain("- For workspace changes, identify the affected package before editing shared files.");
    expect(markdown).toContain("## Validation Before Finishing");
    expect(markdown).toContain("- Run only the evidenced validation commands that are relevant to your change.");
    expect(markdown).toContain("- Run `pnpm test` for the `test` command.");
    expect(markdown).toContain("- Run `pnpm lint` for the `lint` command.");
    expect(markdown).toContain("## Important Directories");
    expect(markdown).toContain("- `src`");
    expect(markdown).toContain("- `scripts`");
    expect(markdown).not.toContain("- `dist`");
    expect(markdown).toContain("## Entrypoints");
    expect(markdown).toContain("- `src/main.ts` (source, medium)");
    expect(markdown).toContain("- `./dist/index.js` (package-output, high, main)");
    expect(markdown).toContain("## Key Config Files");
    expect(markdown).toContain("- `vite.config.ts` (framework)");
    expect(markdown).toContain("## Notes and Boundaries");
    expect(markdown).toContain(
      "- Workspace/monorepo signals detected (high confidence): `pnpm-workspace.yaml`."
    );
    expect(markdown).toContain("- Detected environment variables: `API_URL`.");
  });

  it("omits sections without supporting data", () => {
    const markdown = renderAgentsMd(createMinimalAnalysis());

    expect(markdown).toContain("## Repository Overview");
    expect(markdown).not.toContain("## Priority Commands");
    expect(markdown).toContain("## Validation Before Finishing");
    expect(markdown).toContain("- No validation command was detected. Do not invent one; inspect project scripts first if validation is needed.");
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
