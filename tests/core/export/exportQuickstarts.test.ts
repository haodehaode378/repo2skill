import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import {
  exportQuickstarts,
  renderQuickstart
} from "../../../src/core/export/exportQuickstarts.js";
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
          name: "build",
          command: "vite build",
          confidence: "high"
        }
      ],
      commands: [],
      directories: [],
      configFiles: [],
      entrypoints: ["src/main.ts"],
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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo2skill-quickstart-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

describe("renderQuickstart", () => {
  it("renders detected commands and environment variables", () => {
    const markdown = renderQuickstart(createFullAnalysis(), {
      fileName: "quickstart.windows.md",
      title: "Windows Quickstart",
      shellLabel: "powershell"
    });

    expect(markdown).toContain("# Windows Quickstart");
    expect(markdown).toContain("Package Manager: `pnpm`");
    expect(markdown).toContain("Project Type: `vite`");
    expect(markdown).toContain("## Environment Variables");
    expect(markdown).toContain("- `API_URL` from `.env.example` (high)");
    expect(markdown).toContain("## Start Command");
    expect(markdown).toContain("```powershell");
    expect(markdown).toContain("pnpm dev");
    expect(markdown).toContain("## Available Scripts");
    expect(markdown).toContain("- `dev`: `pnpm dev` (script: `vite`)");
  });

  it("omits optional sections when evidence is missing", () => {
    const markdown = renderQuickstart(createMinimalAnalysis(), {
      fileName: "quickstart.linux.md",
      title: "Linux Quickstart",
      shellLabel: "bash"
    });

    expect(markdown).not.toContain("## Environment Variables");
    expect(markdown).not.toContain("## Start Command");
    expect(markdown).not.toContain("## Available Scripts");
    expect(markdown).toContain("## Notes");
  });
});

describe("exportQuickstarts", () => {
  it("writes all three quickstart files", async () => {
    const outDir = path.join(await createTempDir(), "nested", "out");

    await exportQuickstarts(outDir, createFullAnalysis());

    await expect(fs.pathExists(path.join(outDir, "quickstart.windows.md"))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(outDir, "quickstart.macos.md"))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(outDir, "quickstart.linux.md"))).resolves.toBe(true);
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

    await expect(exportQuickstarts(outDir, invalidAnalysis)).rejects.toThrow();
    await expect(fs.pathExists(path.join(outDir, "quickstart.windows.md"))).resolves.toBe(false);
  });
});
