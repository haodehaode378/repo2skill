import path from "node:path";
import fs from "fs-extra";
import { RepoAnalysisSchema, type RepoAnalysis } from "../../schemas/analysis.js";
import { getCommands } from "./commandHelpers.js";

type ReleaseStatus = "PASS" | "WARN" | "MISSING" | "UNKNOWN";

type ReleaseCheckItem = {
  category: string;
  item: string;
  status: ReleaseStatus;
  evidence: string;
};

export async function exportReleaseCheck(outDir: string, analysis: RepoAnalysis): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);
  const markdown = renderReleaseCheck(validatedAnalysis);

  await fs.ensureDir(outDir);
  await fs.writeFile(path.join(outDir, "release-check.md"), markdown);
}

export function renderReleaseCheck(analysis: RepoAnalysis): string {
  const items = getReleaseCheckItems(analysis);
  const sections: string[] = [];

  sections.push("# GitHub Release Check");
  sections.push("");
  sections.push(`Repository: \`${analysis.repo.name}\``);
  sections.push("");
  sections.push(
    "This checklist is based on static repository evidence. It does not run publish, deploy, release, migration, or target repository lifecycle commands."
  );
  sections.push("");
  sections.push("| Category | Item | Status | Evidence |");
  sections.push("| --- | --- | --- | --- |");

  for (const item of items) {
    sections.push(
      `| ${item.category} | ${item.item} | ${item.status} | ${escapeTableCell(item.evidence)} |`
    );
  }

  sections.push("");
  sections.push("## Prioritized Next Actions");
  sections.push("");

  const required = items.filter((item) => item.status === "MISSING");
  const recommended = items.filter((item) => item.status === "WARN" || item.status === "UNKNOWN");

  sections.push("### Required Before Release");
  sections.push("");
  pushActionLines(
    sections,
    required,
    "No required release blockers were detected from available evidence."
  );
  sections.push("");
  sections.push("### Recommended Before Release");
  sections.push("");
  pushActionLines(
    sections,
    recommended,
    "No recommended follow-up items were detected from available evidence."
  );
  sections.push("");
  sections.push("### Optional Polish");
  sections.push("");
  sections.push("- Review generated onboarding artifacts before publishing them to a repository.");
  sections.push("- Add human-written release notes for user-facing changes.");
  sections.push("");

  return sections.join("\n");
}

export function getReleaseCheckItems(analysis: RepoAnalysis): ReleaseCheckItem[] {
  const docs = analysis.detected.docs;
  const commands = getCommands(analysis);
  const commandByRole = new Map(commands.map((command) => [command.role, command]));
  const configFiles = analysis.detected.configFiles;
  const metadata = analysis.detected.packageMetadata;
  const ciFiles = configFiles.filter((configFile) => configFile.type === "ci");
  const envFiles = configFiles.filter((configFile) => configFile.type === "environment");

  const items: ReleaseCheckItem[] = [];

  items.push(
    docItem("Repository basics", "README", docs, "readme"),
    docItem("Repository basics", "LICENSE", docs, "license"),
    {
      category: "Repository basics",
      item: "package metadata",
      status: metadata ? "PASS" : "UNKNOWN",
      evidence: metadata
        ? `package.json name=${metadata.name ?? "missing"} version=${metadata.version ?? "missing"}`
        : "No package.json metadata was detected."
    },
    {
      category: "Repository basics",
      item: "repository/bugs/homepage metadata",
      status:
        metadata && (metadata.hasRepository || metadata.hasBugs || metadata.hasHomepage)
          ? "PASS"
          : "WARN",
      evidence: metadata
        ? `repository=${yesNo(metadata.hasRepository)}, bugs=${yesNo(metadata.hasBugs)}, homepage=${yesNo(metadata.hasHomepage)} from package.json`
        : "No package.json metadata was detected."
    }
  );

  for (const role of ["build", "test", "lint", "typecheck"] as const) {
    const command = commandByRole.get(role);
    items.push({
      category: "Build and validation",
      item: `${role} command`,
      status: command ? "PASS" : role === "test" || role === "build" ? "MISSING" : "WARN",
      evidence: command
        ? `\`${command.command}\` from ${command.source}`
        : `No ${role} script was detected.`
    });
  }

  items.push({
    category: "Build and validation",
    item: "CI workflow",
    status: ciFiles.length > 0 ? "PASS" : "WARN",
    evidence:
      ciFiles.length > 0
        ? ciFiles.map((configFile) => `\`${configFile.path}\``).join(", ")
        : "No .github/workflows/*.yml file was detected."
  });

  items.push(
    {
      category: "Version and release notes",
      item: "version source",
      status: metadata?.version ? "PASS" : "MISSING",
      evidence: metadata?.version
        ? `package.json version \`${metadata.version}\``
        : "No package version was detected."
    },
    docItem("Version and release notes", "changelog/release notes", docs, "changelog")
  );

  items.push(
    docItem("Usage and examples", "examples directory", docs, "examples"),
    docItem("Usage and examples", "docs directory", docs, "docs"),
    {
      category: "Usage and examples",
      item: "CLI/API usage signal",
      status: metadata?.hasBin || analysis.detected.entrypoints.length > 0 ? "PASS" : "UNKNOWN",
      evidence: metadata?.hasBin
        ? "package.json bin field detected."
        : analysis.detected.entrypoints.length > 0
          ? `Entrypoints: ${analysis.detected.entrypoints.map((entrypoint) => `\`${entrypoint}\``).join(", ")}`
          : "No CLI/API usage signal was detected."
    }
  );

  items.push(
    {
      category: "Safety and maintainability",
      item: "environment examples",
      status:
        envFiles.length > 0 ? "PASS" : analysis.detected.envVars.length > 0 ? "WARN" : "UNKNOWN",
      evidence:
        envFiles.length > 0
          ? envFiles.map((configFile) => `\`${configFile.path}\``).join(", ")
          : analysis.detected.envVars.length > 0
            ? "Environment variables were detected, but no .env example file was detected."
            : "No environment variable evidence was detected."
    },
    docItem("Safety and maintainability", "contribution guide", docs, "contributing"),
    docItem("Safety and maintainability", "code of conduct", docs, "code-of-conduct")
  );

  return items;
}

function docItem(
  category: string,
  item: string,
  docs: RepoAnalysis["detected"]["docs"],
  type: RepoAnalysis["detected"]["docs"][number]["type"]
): ReleaseCheckItem {
  const doc = docs.find((candidate) => candidate.type === type);

  return {
    category,
    item,
    status: doc ? "PASS" : type === "readme" || type === "license" ? "MISSING" : "WARN",
    evidence: doc ? `\`${doc.path}\` (${doc.confidence})` : `No ${item} evidence was detected.`
  };
}

function pushActionLines(
  sections: string[],
  items: ReleaseCheckItem[],
  emptyMessage: string
): void {
  if (items.length === 0) {
    sections.push(`- ${emptyMessage}`);
    return;
  }

  for (const item of items) {
    sections.push(`- ${item.item}: ${item.evidence}`);
  }
}

function yesNo(value: boolean): string {
  return value ? "yes" : "no";
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}
