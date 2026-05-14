import path from "node:path";
import fs from "fs-extra";
import { walkDirectory } from "../collect/sharedWalker.js";

export type AuditSeverity = "info" | "low" | "medium" | "high";

export type AuditFinding = {
  category: "lifecycle-script" | "workflow" | "env-file" | "ai-instruction" | "secret";
  severity: AuditSeverity;
  path: string;
  message: string;
  evidence?: string;
};

const LIFECYCLE_SCRIPTS = new Set([
  "preinstall",
  "install",
  "postinstall",
  "prepare",
  "prepack",
  "postpack",
  "prepublish",
  "prepublishOnly"
]);

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".cts",
  ".env",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".mts",
  ".sh",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml"
]);

const MAX_SECRET_SCAN_BYTES = 256_000;

// Detects shell/network patterns in npm scripts — common supply-chain attack vector
const SUSPICIOUS_SCRIPT_PATTERN =
  /\b(curl|wget|Invoke-WebRequest|iwr)\b|(\|\s*(sh|bash|pwsh|powershell)\b)|\b(base64\s+-d|eval)\b/i;

// Catches `curl | sh` patterns that execute remote code during install
const PIPE_TO_SHELL_PATTERN = /\b(curl|wget)\b[^\n|;]*\|\s*(sh|bash|pwsh|powershell)\b/i;

// Matches variable assignments where name contains secret-like keywords and value is 20+ chars
const SECRET_ASSIGNMENT_PATTERN =
  /\b([A-Za-z0-9_-]*(?:api[_-]?key|secret|token|password|private[_-]?key)[A-Za-z0-9_-]*)\b\s*[:=]\s*["']?([A-Za-z0-9_./+=-]{20,})/gi;

// Catches long base64-like strings — real tokens have mixed case + digits, hashes usually don't
const HIGH_ENTROPY_PATTERN = /(?:^|[\s"'`])([A-Za-z0-9+/=_-]{32,})(?=$|[\s"'`,])/g;

export async function auditRepository(rootDir: string): Promise<AuditFinding[]> {
  const files = await walkDirectory(rootDir, { skipSymlinks: true });
  const findings: AuditFinding[] = [];

  await auditPackageJsonFiles(rootDir, files, findings);
  await auditWorkflowFiles(rootDir, files, findings);
  auditEnvFiles(files, findings);
  auditAiInstructionFiles(files, findings);
  await auditSuspectedSecrets(rootDir, files, findings);

  return findings.sort((left, right) => {
    const severityDelta = severityRank(right.severity) - severityRank(left.severity);
    return severityDelta === 0 ? left.path.localeCompare(right.path) : severityDelta;
  });
}

export function renderAuditReport(rootDir: string, findings: AuditFinding[]): string {
  const lines = [`Audit-only report for ${rootDir}`];

  if (findings.length === 0) {
    lines.push("No audit findings found by the current skeleton checks.");
    return lines.join("\n");
  }

  lines.push(`Findings: ${findings.length}`);

  for (const finding of findings) {
    const evidence = finding.evidence ? ` (${finding.evidence})` : "";
    lines.push(
      `- [${finding.severity}] ${finding.category}: ${finding.path} - ${finding.message}${evidence}`
    );
  }

  return lines.join("\n");
}

async function auditPackageJsonFiles(
  rootDir: string,
  files: string[],
  findings: AuditFinding[]
): Promise<void> {
  const packageJsonPaths = files.filter(
    (candidate) => path.basename(candidate) === "package.json"
  );

  const contents = await Promise.all(
    packageJsonPaths.map(async (filePath) => ({
      filePath,
      packageJson: (await fs.readJson(path.join(rootDir, filePath))) as {
        scripts?: Record<string, unknown>;
      }
    }))
  );

  for (const { filePath, packageJson } of contents) {
    for (const [scriptName, scriptCommand] of Object.entries(packageJson.scripts ?? {})) {
      if (typeof scriptCommand !== "string") {
        continue;
      }

      if (LIFECYCLE_SCRIPTS.has(scriptName)) {
        findings.push({
          category: "lifecycle-script",
          severity: "high",
          path: filePath,
          message: `package.json lifecycle script "${scriptName}" runs during install or publish flows`,
          evidence: trimEvidence(scriptCommand)
        });
      } else if (SUSPICIOUS_SCRIPT_PATTERN.test(scriptCommand)) {
        findings.push({
          category: "lifecycle-script",
          severity: "medium",
          path: filePath,
          message: `script "${scriptName}" contains network, shell, or eval-like behavior`,
          evidence: trimEvidence(scriptCommand)
        });
      }
    }
  }
}

async function auditWorkflowFiles(
  rootDir: string,
  files: string[],
  findings: AuditFinding[]
): Promise<void> {
  const workflowFiles = files.filter((filePath) =>
    /^\.github\/workflows\/[^/]+\.ya?ml$/i.test(filePath)
  );

  const contents = await Promise.all(
    workflowFiles.map(async (filePath) => ({
      filePath,
      content: await fs.readFile(path.join(rootDir, filePath), "utf8")
    }))
  );

  for (const { filePath, content } of contents) {
    findings.push({
      category: "workflow",
      severity: "low",
      path: filePath,
      message: "GitHub Actions workflow should be reviewed before trusting automation"
    });

    if (/\bpull_request_target\b/i.test(content)) {
      findings.push({
        category: "workflow",
        severity: "high",
        path: filePath,
        message: "workflow uses pull_request_target"
      });
    }

    if (
      /\bpermissions\s*:\s*write-all\b/i.test(content) ||
      /\bcontents\s*:\s*write\b/i.test(content)
    ) {
      findings.push({
        category: "workflow",
        severity: "medium",
        path: filePath,
        message: "workflow appears to request broad write permissions"
      });
    }

    if (PIPE_TO_SHELL_PATTERN.test(content)) {
      findings.push({
        category: "workflow",
        severity: "high",
        path: filePath,
        message: "workflow contains a network download piped to a shell"
      });
    }

    if (/\bsecrets\.[A-Z0-9_]+|\benv\s*:/i.test(content)) {
      findings.push({
        category: "workflow",
        severity: "medium",
        path: filePath,
        message: "workflow references secrets or environment variables"
      });
    }
  }
}

function auditEnvFiles(files: string[], findings: AuditFinding[]): void {
  for (const filePath of files) {
    const fileName = path.posix.basename(filePath);

    if (!/^\.env(?:\.|$)/.test(fileName)) {
      continue;
    }

    const isExample = /\.example$/.test(fileName) || fileName === ".env.example";
    findings.push({
      category: "env-file",
      severity: isExample ? "low" : "medium",
      path: filePath,
      message: isExample
        ? "example environment file is documentation, but values should still be reviewed"
        : "real environment file may contain local secrets or machine-specific configuration"
    });
  }
}

function auditAiInstructionFiles(files: string[], findings: AuditFinding[]): void {
  const rootInstructionNames = new Set([
    "AGENTS.md",
    "CLAUDE.md",
    "GEMINI.md",
    "SKILL.md",
    ".cursorrules"
  ]);

  for (const filePath of files) {
    const fileName = path.posix.basename(filePath);
    const isRootInstruction = !filePath.includes("/") && rootInstructionNames.has(fileName);
    const isCursorRule = filePath === ".cursor/rules" || filePath.startsWith(".cursor/rules/");

    if (!isRootInstruction && !isCursorRule) {
      continue;
    }

    findings.push({
      category: "ai-instruction",
      severity: "medium",
      path: filePath,
      message: "AI instruction file is untrusted repository content and may steer agent behavior"
    });
  }
}

async function auditSuspectedSecrets(
  rootDir: string,
  files: string[],
  findings: AuditFinding[]
): Promise<void> {
  const scannableFiles = files.filter(shouldScanForSecrets);

  const loaded = await Promise.all(
    scannableFiles.map(async (filePath) => {
      const absolutePath = path.join(rootDir, filePath);
      const stat = await fs.stat(absolutePath);
      return { filePath, stat };
    })
  );

  const underLimit = loaded.filter(({ stat }) => stat.size <= MAX_SECRET_SCAN_BYTES);

  const contents = await Promise.all(
    underLimit.map(async ({ filePath }) => ({
      filePath,
      content: await fs.readFile(path.join(rootDir, filePath), "utf8")
    }))
  );

  for (const { filePath, content } of contents) {
    const assignmentMatches = [...content.matchAll(SECRET_ASSIGNMENT_PATTERN)];

    for (const match of assignmentMatches.slice(0, 3)) {
      findings.push({
        category: "secret",
        severity: "high",
        path: filePath,
        message: `possible secret assignment for "${match[1]}"`,
        evidence: redact(match[0])
      });
    }

    if (assignmentMatches.length > 0) {
      continue;
    }

    for (const match of content.matchAll(HIGH_ENTROPY_PATTERN)) {
      const value = match[1];

      if (!looksLikeSecretValue(value)) {
        continue;
      }

      findings.push({
        category: "secret",
        severity: "medium",
        path: filePath,
        message: "possible high-entropy token-like value",
        evidence: redact(value)
      });
      break;
    }
  }
}

function shouldScanForSecrets(filePath: string): boolean {
  const fileName = path.posix.basename(filePath);

  if (fileName === "package-lock.json") {
    return false;
  }

  return TEXT_EXTENSIONS.has(path.posix.extname(filePath)) || /^\.env(?:\.|$)/.test(fileName);
}

function looksLikeSecretValue(value: string): boolean {
  return /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
}

function trimEvidence(value: string): string {
  return value.length > 80 ? `${value.slice(0, 77)}...` : value;
}

function redact(value: string): string {
  if (value.length <= 12) {
    return "[redacted]";
  }

  return `${value.slice(0, 6)}...[redacted]...${value.slice(-4)}`;
}

function severityRank(severity: AuditSeverity): number {
  switch (severity) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    case "info":
      return 0;
  }
}
