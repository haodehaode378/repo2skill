import path from "node:path";
import fs from "fs-extra";
import {
  RepoAnalysisSchema,
  type CommandCandidate,
  type RepoAnalysis
} from "../../schemas/analysis.js";
import { getCommands, getValidationCommands } from "./commandHelpers.js";

export async function exportDemoScreenshotPlan(
  outDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);
  const markdown = renderDemoScreenshotPlan(validatedAnalysis);

  await fs.ensureDir(outDir);
  await fs.writeFile(path.join(outDir, "demo-screenshot-plan.md"), markdown);
}

export function renderDemoScreenshotPlan(analysis: RepoAnalysis): string {
  const commands = getCommands(analysis);
  const devCommand = findCommand(commands, "dev") ?? findCommand(commands, "other", "start");
  const validationCommands = getValidationCommands(commands);
  const isWebLike =
    analysis.detected.projectType === "vite" ||
    analysis.detected.projectType === "nextjs" ||
    analysis.detected.demoSignals.some((signal) => signal.type === "route");
  const sections: string[] = [];

  sections.push("# Demo Screenshot Plan");
  sections.push("");
  sections.push(`Repository: \`${analysis.repo.name}\``);
  sections.push("");
  sections.push(
    "This plan lists captures to take manually. It does not claim screenshots or recordings already exist."
  );
  sections.push("");
  sections.push("## Setup");
  sections.push("");
  sections.push(
    `- Install dependencies: \`${getInstallCommand(analysis.detected.packageManager)}\``
  );
  sections.push(
    devCommand
      ? `- Start the demo: \`${devCommand.command}\` from ${devCommand.source}`
      : "- Start the demo: no dev/start command was detected."
  );
  sections.push("");
  sections.push("## Demo Flow");
  sections.push("");
  if (isWebLike) {
    sections.push("- Open the local app after the dev server starts.");
    sections.push("- Capture the initial screen.");
    sections.push("- Capture each evidenced route/page area.");
    sections.push("- Capture validation output after the demo flow.");
  } else if (analysis.detected.packageMetadata?.hasBin) {
    sections.push("- Capture CLI help or usage output.");
    sections.push("- Capture one successful command run.");
    sections.push("- Capture validation output.");
  } else {
    sections.push("- Capture install output.");
    sections.push("- Capture usage from README/examples if present.");
    sections.push("- Capture validation output.");
  }
  sections.push("");
  sections.push("## Screenshot Checklist");
  sections.push("");
  const screenshots = getScreenshotItems(analysis, validationCommands, devCommand);
  if (screenshots.length === 0) {
    sections.push("- `01-install-or-setup.png`: dependency installation or setup evidence.");
    sections.push("- `02-validation.png`: build/test output evidence.");
  } else {
    for (const screenshot of screenshots) {
      sections.push(`- ${screenshot}`);
    }
  }
  sections.push("");
  sections.push("## Recording Script");
  sections.push("");
  sections.push("1. Show repository root and README.");
  sections.push(
    `2. Run \`${getInstallCommand(analysis.detected.packageManager)}\` if dependencies are not installed.`
  );
  sections.push(
    devCommand
      ? `3. Run \`${devCommand.command}\` and show successful startup.`
      : "3. Explain that no dev/start command was detected."
  );
  sections.push("4. Walk through the evidenced feature or usage flow.");
  sections.push(
    validationCommands.length > 0
      ? `5. Run validation: ${validationCommands.map((command) => `\`${command.command}\``).join(", ")}.`
      : "5. Explain that no validation command was detected."
  );
  sections.push("");
  sections.push("## Acceptance Steps");
  sections.push("");
  sections.push(
    "- Every screenshot filename in the checklist is either captured or marked not applicable."
  );
  sections.push("- Startup and validation commands are shown with real terminal output.");
  sections.push("- Any missing environment variables are documented before the demo.");
  sections.push("");
  sections.push("## Unknowns Requiring Manual Verification");
  sections.push("");
  sections.push(
    "- Runtime URL, port, and browser state cannot be confirmed from static analysis alone."
  );
  sections.push("- Screenshots must be captured after manually starting the project.");
  sections.push("");

  return sections.join("\n");
}

function getScreenshotItems(
  analysis: RepoAnalysis,
  validationCommands: CommandCandidate[],
  devCommand: CommandCandidate | undefined
): string[] {
  const items: string[] = [];

  if (devCommand) {
    items.push(`\`01-startup.png\`: terminal output for \`${devCommand.command}\`.`);
  }

  for (const signal of analysis.detected.demoSignals) {
    const safeName = signal.path
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
    const fileName = `${String(items.length + 1).padStart(2, "0")}-${safeName}.png`;

    if (signal.type === "route") {
      items.push(`\`${fileName}\`: screen for route/page evidence \`${signal.path}\`.`);
    } else if (signal.type === "asset") {
      items.push(`\`${fileName}\`: visual asset evidence from \`${signal.path}\`.`);
    } else {
      items.push(`\`${fileName}\`: example usage evidence from \`${signal.path}\`.`);
    }
  }

  for (const command of validationCommands) {
    const fileName = `${String(items.length + 1).padStart(2, "0")}-${command.role}.png`;
    items.push(`\`${fileName}\`: terminal validation output for \`${command.command}\`.`);
  }

  return items;
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
  role: CommandCandidate["role"],
  name?: string
): CommandCandidate | undefined {
  return commands.find((command) => command.role === role && (!name || command.name === name));
}
