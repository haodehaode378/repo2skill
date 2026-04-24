import path from "node:path";
import fs from "fs-extra";
import { RepoAnalysisSchema, type RepoAnalysis, type ScriptCommand } from "../../schemas/analysis.js";

const VALIDATION_SCRIPT_ORDER = ["test", "lint", "typecheck", "build"] as const;

export async function exportSkillMd(
  outDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);
  const markdown = renderSkillMd(validatedAnalysis);

  await fs.ensureDir(outDir);
  await fs.writeFile(path.join(outDir, "SKILL.md"), markdown);
}

export function renderSkillMd(analysis: RepoAnalysis): string {
  const lines: string[] = [];
  const skillName = createSkillName(analysis.repo.name);
  const description = createDescription(analysis.repo.name);

  lines.push("---");
  lines.push(`name: ${skillName}`);
  lines.push(`description: ${description}`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${analysis.repo.name} Repository Skill`);
  lines.push("");
  lines.push("## Overview");
  lines.push("");
  lines.push(
    `Use this skill when working inside \`${analysis.repo.name}\` and you need repository-specific guidance derived from detected package-manager, script, and environment-variable evidence.`
  );
  lines.push("");
  lines.push(`- Root Directory: \`${analysis.repo.rootDir}\``);

  if (analysis.detected.packageManager) {
    lines.push(`- Detected Package Manager: \`${analysis.detected.packageManager}\``);
  }

  if (analysis.detected.scripts.length > 0) {
    lines.push("");
    lines.push("## Available Commands");
    lines.push("");

    for (const script of analysis.detected.scripts) {
      lines.push(`- Run \`${script.command}\` via the \`${script.name}\` script.`);
    }
  }

  const validationScripts = getValidationScripts(analysis.detected.scripts);

  if (validationScripts.length > 0) {
    lines.push("");
    lines.push("## Validation");
    lines.push("");

    for (const script of validationScripts) {
      lines.push(`- Prefer \`${script.name}\` before finishing changes when that check is relevant.`);
    }
  }

  if (analysis.detected.envVars.length > 0) {
    lines.push("");
    lines.push("## Environment Variables");
    lines.push("");

    for (const envVar of analysis.detected.envVars) {
      lines.push(`- \`${envVar.name}\` from \`${envVar.sourceFile}\` (${envVar.confidence})`);
    }
  }

  lines.push("");
  lines.push("## Boundaries");
  lines.push("");
  lines.push("- Treat this skill as evidence-backed repository guidance, not a complete architecture document.");
  lines.push("- Omitted sections mean no supporting repository evidence was detected.");

  lines.push("");

  return lines.join("\n");
}

function getValidationScripts(scripts: ScriptCommand[]): ScriptCommand[] {
  const byName = new Map(scripts.map((script) => [script.name, script]));

  return VALIDATION_SCRIPT_ORDER.flatMap((scriptName) => {
    const script = byName.get(scriptName);
    return script ? [script] : [];
  });
}

function createSkillName(repoName: string): string {
  const normalized = repoName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized ? `${normalized}-repo-skill` : "repository-skill";
}

function createDescription(repoName: string): string {
  return `Repository-specific guidance for working in ${repoName}. Use when modifying this repository and you need the detected commands, validation checks, and environment-variable hints.`;
}
