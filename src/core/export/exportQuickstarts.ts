import path from "node:path";
import fs from "fs-extra";
import { RepoAnalysisSchema, type RepoAnalysis, type ScriptCommand } from "../../schemas/analysis.js";

type QuickstartTarget = {
  fileName: string;
  title: string;
  shellLabel: string;
};

const QUICKSTART_TARGETS: QuickstartTarget[] = [
  {
    fileName: "quickstart.windows.md",
    title: "Windows Quickstart",
    shellLabel: "powershell"
  },
  {
    fileName: "quickstart.macos.md",
    title: "macOS Quickstart",
    shellLabel: "bash"
  },
  {
    fileName: "quickstart.linux.md",
    title: "Linux Quickstart",
    shellLabel: "bash"
  }
];

export async function exportQuickstarts(
  outDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);

  await fs.ensureDir(outDir);

  for (const target of QUICKSTART_TARGETS) {
    const markdown = renderQuickstart(validatedAnalysis, target);
    await fs.writeFile(path.join(outDir, target.fileName), markdown);
  }
}

export function renderQuickstart(
  analysis: RepoAnalysis,
  target: QuickstartTarget
): string {
  const lines: string[] = [];
  const suggestedCommand = getSuggestedStartCommand(analysis.detected.scripts);

  lines.push(`# ${target.title}`);
  lines.push("");
  lines.push(`Repository: \`${analysis.repo.name}\``);
  lines.push(`Root Directory: \`${analysis.repo.rootDir}\``);

  if (analysis.detected.packageManager) {
    lines.push(`Package Manager: \`${analysis.detected.packageManager}\``);
  }

  if (analysis.detected.projectType) {
    lines.push(`Project Type: \`${analysis.detected.projectType}\``);
  }

  if (analysis.detected.envVars.length > 0) {
    lines.push("");
    lines.push("## Environment Variables");
    lines.push("");
    lines.push("Set these variables before running the project if they are relevant:");
    lines.push("");

    for (const envVar of analysis.detected.envVars) {
      lines.push(`- \`${envVar.name}\` from \`${envVar.sourceFile}\` (${envVar.confidence})`);
    }
  }

  if (suggestedCommand) {
    lines.push("");
    lines.push("## Start Command");
    lines.push("");
    lines.push("Run the most likely start command:");
    lines.push("");
    lines.push(`\`\`\`${target.shellLabel}`);
    lines.push(suggestedCommand.command);
    lines.push("```");
  }

  if (analysis.detected.scripts.length > 0) {
    lines.push("");
    lines.push("## Available Scripts");
    lines.push("");

    for (const script of analysis.detected.scripts) {
      lines.push(`- \`${script.name}\`: \`${script.command}\``);
    }
  }

  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- This quickstart only uses commands detected from repository evidence.");
  lines.push("- Missing install or setup steps mean no explicit evidence was detected for them.");
  lines.push("");

  return lines.join("\n");
}

function getSuggestedStartCommand(
  scripts: ScriptCommand[]
): ScriptCommand | undefined {
  const preferredOrder = ["dev", "start", "build", "test"] as const;
  const byName = new Map(scripts.map((script) => [script.name, script]));

  for (const scriptName of preferredOrder) {
    const script = byName.get(scriptName);

    if (script) {
      return script;
    }
  }

  return undefined;
}
