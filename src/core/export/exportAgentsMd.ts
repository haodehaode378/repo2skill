import path from "node:path";
import fs from "fs-extra";
import { RepoAnalysisSchema, type RepoAnalysis, type ScriptCommand } from "../../schemas/analysis.js";

const VALIDATION_SCRIPT_ORDER = ["test", "lint", "typecheck", "build"] as const;

export async function exportAgentsMd(
  outDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);
  const markdown = renderAgentsMd(validatedAnalysis);

  await fs.ensureDir(outDir);
  await fs.writeFile(path.join(outDir, "AGENTS.md"), markdown);
}

export function renderAgentsMd(analysis: RepoAnalysis): string {
  const sections: string[] = [];

  sections.push("## Repository Overview");
  sections.push("");
  sections.push(`- Name: \`${analysis.repo.name}\``);
  sections.push(`- Root Directory: \`${analysis.repo.rootDir}\``);

  if (analysis.detected.packageManager) {
    sections.push(`- Detected Package Manager: \`${analysis.detected.packageManager}\``);
  }

  if (analysis.detected.scripts.length > 0) {
    sections.push("");
    sections.push("## Priority Commands");
    sections.push("");

    for (const script of analysis.detected.scripts) {
      sections.push(`- \`${script.name}\`: \`${script.command}\``);
    }
  }

  const validationScripts = getValidationScripts(analysis.detected.scripts);

  if (validationScripts.length > 0) {
    sections.push("");
    sections.push("## Validation Before Finishing");
    sections.push("");

    for (const script of validationScripts) {
      sections.push(`- Run \`${script.command}\` via the \`${script.name}\` script.`);
    }
  }

  const importantDirectories = getImportantDirectories(analysis.detected.entrypoints);

  if (importantDirectories.length > 0) {
    sections.push("");
    sections.push("## Important Directories");
    sections.push("");

    for (const directory of importantDirectories) {
      sections.push(`- \`${directory}\``);
    }
  }

  const notes = getNotesAndBoundaries(analysis);

  if (notes.length > 0) {
    sections.push("");
    sections.push("## Notes and Boundaries");
    sections.push("");

    for (const note of notes) {
      sections.push(`- ${note}`);
    }
  }

  sections.push("");

  return sections.join("\n");
}

function getValidationScripts(scripts: ScriptCommand[]): ScriptCommand[] {
  const byName = new Map(scripts.map((script) => [script.name, script]));

  return VALIDATION_SCRIPT_ORDER.flatMap((scriptName) => {
    const script = byName.get(scriptName);
    return script ? [script] : [];
  });
}

function getImportantDirectories(entrypoints: string[]): string[] {
  const directories: string[] = [];
  const seen = new Set<string>();

  for (const entrypoint of entrypoints) {
    const directory = path.posix.dirname(entrypoint);

    if (directory === "." || seen.has(directory)) {
      continue;
    }

    seen.add(directory);
    directories.push(directory);
  }

  return directories;
}

function getNotesAndBoundaries(analysis: RepoAnalysis): string[] {
  const notes: string[] = [];

  if (analysis.detected.envVars.length > 0) {
    const envVarList = analysis.detected.envVars.map((envVar) => `\`${envVar.name}\``).join(", ");
    notes.push(`Detected environment variables: ${envVarList}.`);
  }

  if (analysis.evidence.length > 0) {
    notes.push(`This file reflects ${analysis.evidence.length} evidenced findings from the repository analysis.`);
  }

  return notes;
}
