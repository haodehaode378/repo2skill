import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import {
  exportSkillMd,
  renderSkillMd
} from "../../../src/core/export/exportSkillMd.js";
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
          name: "build",
          command: "tsc -b",
          confidence: "high"
        }
      ],
      commands: [],
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
          path: "vite.config.ts",
          type: "framework",
          confidence: "high"
        }
      ],
      entrypoints: ["src/main.ts", "./dist/index.js"],
      entrypointFacts: [
        {
          path: "src/main.ts",
          role: "source",
          source: "src/main.ts",
          confidence: "medium"
        },
        {
          path: "./dist/index.js",
          role: "package-output",
          source: "package.json",
          confidence: "high",
          reason: "main"
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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo2skill-skill-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

describe("renderSkillMd", () => {
  it("renders frontmatter and evidenced sections", () => {
    const markdown = renderSkillMd(createFullAnalysis());

    expect(markdown).toContain("---");
    expect(markdown).toContain("name: repo-repo-skill");
    expect(markdown).toContain("description: Repository-specific guidance for working in repo.");
    expect(markdown).toContain("## Use When");
    expect(markdown).toContain("- You are working inside `repo`.");
    expect(markdown).toContain("- Detected Package Manager: `pnpm`");
    expect(markdown).toContain("## Steps");
    expect(markdown).toContain("- Review relevant config files first: `vite.config.ts`.");
    expect(markdown).toContain("- Start code navigation from evidenced directories: `src`.");
    expect(markdown).toContain("- For workspace changes, identify the affected package before editing shared files.");
    expect(markdown).toContain("## Commands");
    expect(markdown).toContain("- Run `pnpm dev` for `dev` (script: `vite`).");
    expect(markdown).toContain("## Validation");
    expect(markdown).toContain("- Prefer `pnpm test` before finishing changes when that check is relevant.");
    expect(markdown).toContain("## References");
    expect(markdown).toContain("- Config: `vite.config.ts` (framework, high)");
    expect(markdown).toContain("- Entrypoint: `src/main.ts` (source, medium)");
    expect(markdown).toContain("- Entrypoint: `./dist/index.js` (package-output, high, main)");
    expect(markdown).toContain("- Directory: `src` (source, medium)");
    expect(markdown).toContain("- Workspace signals: `pnpm-workspace.yaml` (high)");
    expect(markdown).toContain("- Workspace package globs: `apps/*`, `packages/*`");
    expect(markdown).toContain("- Env: `API_URL` from `.env.example` (high)");
    expect(markdown).toContain("## Boundaries");
  });

  it("omits optional sections without supporting data", () => {
    const markdown = renderSkillMd(createMinimalAnalysis());

    expect(markdown).toContain("## Use When");
    expect(markdown).not.toContain("## Commands");
    expect(markdown).not.toContain("## References");
    expect(markdown).not.toContain("## Validation");
    expect(markdown).toContain("## Boundaries");
  });
});

describe("exportSkillMd", () => {
  it("writes SKILL.md to the output directory", async () => {
    const outDir = path.join(await createTempDir(), "nested", "out");

    await exportSkillMd(outDir, createFullAnalysis());

    const outputPath = path.join(outDir, "SKILL.md");

    await expect(fs.pathExists(outputPath)).resolves.toBe(true);
    await expect(fs.readFile(outputPath, "utf8")).resolves.toContain("## Commands");
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

    await expect(exportSkillMd(outDir, invalidAnalysis)).rejects.toThrow();
    await expect(fs.pathExists(path.join(outDir, "SKILL.md"))).resolves.toBe(false);
  });
});
