import path from "node:path";
import fs from "fs-extra";
import {
  RepoAnalysisSchema,
  type CommandCandidate,
  type RepoAnalysis
} from "../../schemas/analysis.js";
import { getCommands, getValidationCommands } from "./commandHelpers.js";

export async function exportCourseProjectReport(
  outDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);
  const markdown = renderCourseProjectReport(validatedAnalysis);

  await fs.ensureDir(outDir);
  await fs.writeFile(path.join(outDir, "course-project-report.md"), markdown);
}

export function renderCourseProjectReport(analysis: RepoAnalysis): string {
  const commands = getCommands(analysis);
  const installCommand = getInstallCommand(analysis.detected.packageManager);
  const devCommand = findCommand(commands, "dev");
  const validationCommands = getValidationCommands(commands);
  const moduleCandidates = getModuleCandidates(analysis);
  const metadata = analysis.detected.packageMetadata;
  const sections: string[] = [];

  sections.push("# Course Project Report Draft");
  sections.push("");
  sections.push(`## Project Title`);
  sections.push("");
  sections.push(`- Candidate: \`${metadata?.name ?? analysis.repo.name}\``);
  sections.push("");
  sections.push("## Project Overview");
  sections.push("");
  sections.push(
    `This report scaffold is generated from repository evidence for \`${analysis.repo.name}\`. Fill in business goals and screenshots after manually running the project.`
  );
  sections.push("");
  sections.push("## Technology Stack");
  sections.push("");
  pushMaybe(sections, "Package manager", analysis.detected.packageManager);
  pushMaybe(sections, "Project type", analysis.detected.projectType);
  pushList(
    sections,
    "Key config files",
    analysis.detected.configFiles.map(
      (configFile) => `\`${configFile.path}\` (${configFile.type}, ${configFile.confidence})`
    ),
    "No framework, test, lint, format, package, or environment config files were detected."
  );
  sections.push("");
  sections.push("## Runtime Environment");
  sections.push("");
  sections.push(`- Install: \`${installCommand}\``);
  sections.push(
    devCommand
      ? `- Start/develop: \`${devCommand.command}\` from ${devCommand.source}`
      : "- Start/develop: no dev/start script was detected."
  );
  pushList(
    sections,
    "Environment variables",
    analysis.detected.envVars.map(
      (envVar) => `\`${envVar.name}\` from \`${envVar.sourceFile}\` (${envVar.confidence})`
    ),
    "No environment variable evidence was detected."
  );
  sections.push("");
  sections.push("## Functional Modules");
  sections.push("");
  pushList(
    sections,
    "Module candidates",
    moduleCandidates,
    "No module directories beyond detected entrypoints were found."
  );
  sections.push("");
  sections.push("## Directory Structure");
  sections.push("");
  pushList(
    sections,
    "Important directories",
    analysis.detected.directories.map(
      (directory) =>
        `\`${directory.path}\` (${directory.role}, ${directory.confidence}) from \`${directory.source}\``
    ),
    "No important source or workspace directories were detected."
  );
  sections.push("");
  sections.push("## Key Files And Responsibilities");
  sections.push("");
  pushList(
    sections,
    "Entrypoints",
    analysis.detected.entrypoints.map((entrypoint) => `\`${entrypoint}\``),
    "No source entrypoint was detected."
  );
  pushList(
    sections,
    "Evidence-backed commands",
    commands.map((command) => `\`${command.command}\` (${command.role}) from ${command.source}`),
    "No package scripts were detected."
  );
  sections.push("");
  sections.push("## Testing And Validation");
  sections.push("");
  pushList(
    sections,
    "Validation commands",
    validationCommands.map((command) => `\`${command.command}\` (${command.role})`),
    "No build, test, lint, or typecheck command was detected."
  );
  sections.push("");
  sections.push("## Demo Screenshot Checklist");
  sections.push("");
  pushList(
    sections,
    "Suggested captures",
    getScreenshotChecklist(analysis, devCommand),
    "No demo-specific signals were detected. Capture install, startup, and validation terminal output."
  );
  sections.push("");
  sections.push("## Known Limitations And Future Work");
  sections.push("");
  sections.push("- This draft is static-analysis based; confirm runtime behavior manually.");
  sections.push("- Add real screenshots after running the project locally.");
  sections.push(
    "- Replace inferred module descriptions with implementation-specific explanations."
  );
  sections.push("");
  sections.push("## Evidence Appendix");
  sections.push("");
  pushList(
    sections,
    "Evidence",
    analysis.evidence.slice(0, 30).map((record) => {
      const reason = record.reason ? ` - ${record.reason}` : "";
      return `\`${record.sourceFile}\`: ${record.claim} (${record.confidence})${reason}`;
    }),
    "No evidence records were produced."
  );
  sections.push("");

  return sections.join("\n");
}

function getModuleCandidates(analysis: RepoAnalysis): string[] {
  const fromDirectories = analysis.detected.directories.map(
    (directory) => `\`${directory.path}\` (${directory.role})`
  );
  const fromRoutes = analysis.detected.demoSignals
    .filter((signal) => signal.type === "route")
    .map((signal) => `\`${signal.path}\` (route candidate)`);

  return [...new Set([...fromDirectories, ...fromRoutes])];
}

function getScreenshotChecklist(
  analysis: RepoAnalysis,
  devCommand: CommandCandidate | undefined
): string[] {
  const checklist: string[] = [];

  if (devCommand) {
    checklist.push(`Terminal: successful startup with \`${devCommand.command}\`.`);
  }

  for (const signal of analysis.detected.demoSignals) {
    if (signal.type === "route") {
      checklist.push(`UI: route/page area from \`${signal.path}\`.`);
    } else if (signal.type === "asset") {
      checklist.push(`UI/assets: static asset area from \`${signal.path}\`.`);
    } else {
      checklist.push(`Example flow: sample usage from \`${signal.path}\`.`);
    }
  }

  for (const command of getValidationCommands(getCommands(analysis))) {
    checklist.push(`Terminal: validation output for \`${command.command}\`.`);
  }

  return checklist;
}

function getInstallCommand(packageManager: string | undefined): string {
  if (packageManager === "pnpm") {
    return "pnpm install";
  }

  if (packageManager === "yarn") {
    return "yarn install";
  }

  if (packageManager === "bun") {
    return "bun install";
  }

  return "npm install";
}

function findCommand(
  commands: CommandCandidate[],
  role: CommandCandidate["role"]
): CommandCandidate | undefined {
  return commands.find((command) => command.role === role);
}

function pushMaybe(sections: string[], label: string, value: string | undefined): void {
  sections.push(value ? `- ${label}: \`${value}\`` : `- ${label}: not detected.`);
}

function pushList(sections: string[], label: string, values: string[], emptyMessage: string): void {
  sections.push(`- ${label}:`);

  if (values.length === 0) {
    sections.push(`  - ${emptyMessage}`);
    return;
  }

  for (const value of values) {
    sections.push(`  - ${value}`);
  }
}
