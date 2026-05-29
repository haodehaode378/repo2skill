import path from "node:path";
import fs from "fs-extra";
import { RepoAnalysisSchema, type RepoAnalysis } from "../../schemas/analysis.js";
import { getCommands, getValidationCommands } from "./commandHelpers.js";

export async function exportIssueToPrPlan(
  outDir: string,
  analysis: RepoAnalysis,
  issueText?: string
): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);
  const markdown = renderIssueToPrPlan(validatedAnalysis, issueText);

  await fs.ensureDir(outDir);
  await fs.writeFile(path.join(outDir, "issue-to-pr-plan.md"), markdown);
}

export function renderIssueToPrPlan(analysis: RepoAnalysis, issueText?: string): string {
  const trimmedIssue = issueText?.trim();
  const commands = getCommands(analysis);
  const validationCommands = getValidationCommands(commands);
  const sections: string[] = [];

  sections.push("# Issue To PR Plan");
  sections.push("");
  sections.push(`Repository: \`${analysis.repo.name}\``);
  sections.push("");

  if (trimmedIssue) {
    sections.push("## Issue Input");
    sections.push("");
    sections.push("```md");
    sections.push(trimmedIssue);
    sections.push("```");
  } else {
    sections.push(
      "> No issue text was provided. Use `--issue-file <path>` with `--profile issue-to-pr` to generate a more specific plan."
    );
  }

  sections.push("");
  sections.push("## Issue Summary");
  sections.push("");
  sections.push(
    trimmedIssue
      ? "- Summarize the issue against the repository evidence before implementation."
      : "- Missing issue input; this is a reusable PR planning scaffold."
  );
  sections.push("");
  sections.push("## Proposed Scope");
  sections.push("");
  sections.push("- Keep changes limited to files required by the issue.");
  sections.push(
    "- Do not run publish, deploy, release, migration, or destructive commands without explicit confirmation."
  );
  sections.push("");
  sections.push("## Files And Directories To Inspect");
  sections.push("");
  pushList(
    sections,
    analysis.detected.directories.map(
      (directory) =>
        `\`${directory.path}\` (${directory.role}, ${directory.confidence}) from \`${directory.source}\``
    ),
    "No source or workspace directories were detected."
  );
  sections.push("");
  sections.push("## Implementation Plan");
  sections.push("");
  sections.push("1. Re-read the issue and write down assumptions.");
  sections.push("2. Inspect the evidenced files/directories before editing.");
  sections.push("3. Make the smallest code change that satisfies the issue.");
  sections.push("4. Update tests or docs only when required by the issue.");
  sections.push("5. Run the relevant validation commands.");
  sections.push("");
  sections.push("## Validation Plan");
  sections.push("");
  pushList(
    sections,
    validationCommands.map(
      (command) => `\`${command.command}\` (${command.role}) from ${command.source}`
    ),
    "No build, test, lint, or typecheck command was detected."
  );
  sections.push("");
  sections.push("## Acceptance Criteria");
  sections.push("");
  sections.push("- The issue's observable behavior is satisfied.");
  sections.push("- Relevant validation commands pass or any failures are explained with evidence.");
  sections.push("- No unrelated files are reformatted or refactored.");
  sections.push("- Any missing requirements are called out before implementation.");
  sections.push("");
  sections.push("## Risks And Open Questions");
  sections.push("");
  sections.push(
    trimmedIssue
      ? "- Confirm ambiguous issue language before broad changes."
      : "- Issue text is missing, so affected files and acceptance criteria cannot be made issue-specific."
  );
  sections.push("");
  sections.push("## Suggested PR Title");
  sections.push("");
  sections.push(
    trimmedIssue ? "- `fix: address issue scope`" : "- `chore: prepare issue implementation plan`"
  );
  sections.push("");
  sections.push("## PR Description Draft");
  sections.push("");
  sections.push("- Summary: describe the focused change.");
  sections.push("- Validation: list commands run and results.");
  sections.push("- Notes: mention any missing evidence or follow-up work.");
  sections.push("");

  return sections.join("\n");
}

function pushList(sections: string[], values: string[], emptyMessage: string): void {
  if (values.length === 0) {
    sections.push(`- ${emptyMessage}`);
    return;
  }

  for (const value of values) {
    sections.push(`- ${value}`);
  }
}
