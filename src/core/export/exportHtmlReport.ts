import path from "node:path";
import fs from "fs-extra";
import { RepoAnalysisSchema, type RepoAnalysis } from "../../schemas/analysis.js";
import { getDisplayEnvVars, getOmittedEnvVarCount } from "../envVars/display.js";

export async function exportHtmlReport(
  outDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);
  const html = renderHtmlReport(validatedAnalysis);

  await fs.ensureDir(outDir);
  await fs.writeFile(path.join(outDir, "report.html"), html);
}

export function renderHtmlReport(analysis: RepoAnalysis): string {
  const title = escapeHtml(`${analysis.repo.name} Report`);
  const sections: string[] = [];

  sections.push(`<section><h2>Repository Overview</h2><ul>`);
  sections.push(`<li><strong>Name:</strong> <code>${escapeHtml(analysis.repo.name)}</code></li>`);
  sections.push(`<li><strong>Input:</strong> <code>${escapeHtml(analysis.repo.input)}</code></li>`);
  sections.push(
    `<li><strong>Root Directory:</strong> <code>${escapeHtml(analysis.repo.rootDir)}</code></li>`
  );
  sections.push(`</ul></section>`);

  const detectedItems: string[] = [];
  if (analysis.detected.packageManager) {
    detectedItems.push(
      `<li><strong>Package Manager:</strong> <code>${escapeHtml(analysis.detected.packageManager)}</code></li>`
    );
  }
  if (analysis.detected.projectType) {
    detectedItems.push(
      `<li><strong>Project Type:</strong> <code>${escapeHtml(analysis.detected.projectType)}</code></li>`
    );
  }
  if (detectedItems.length > 0) {
    sections.push(`<section><h2>Detected Signals</h2><ul>${detectedItems.join("")}</ul></section>`);
  }

  if (analysis.detected.scripts.length > 0) {
    sections.push("<section><h2>Scripts</h2><table><thead><tr><th>Name</th><th>Command</th><th>Confidence</th></tr></thead><tbody>");
    for (const script of analysis.detected.scripts) {
      sections.push(
        `<tr><td><code>${escapeHtml(script.name)}</code></td><td><code>${escapeHtml(
          script.command
        )}</code></td><td>${escapeHtml(script.confidence)}</td></tr>`
      );
    }
    sections.push("</tbody></table></section>");
  }

  if (analysis.detected.workspace) {
    sections.push("<section><h2>Workspace</h2><ul>");
    sections.push(
      `<li><strong>Confidence:</strong> <code>${escapeHtml(analysis.detected.workspace.confidence)}</code></li>`
    );

    if (analysis.detected.workspace.signals.length > 0) {
      sections.push(
        `<li><strong>Signals:</strong> ${analysis.detected.workspace.signals
          .map((signal) => `<code>${escapeHtml(signal)}</code>`)
          .join(", ")}</li>`
      );
    }

    if (analysis.detected.workspace.packageGlobs.length > 0) {
      sections.push(
        `<li><strong>Package Globs:</strong> ${analysis.detected.workspace.packageGlobs
          .map((workspaceGlob) => `<code>${escapeHtml(workspaceGlob)}</code>`)
          .join(", ")}</li>`
      );
    }

    sections.push("</ul></section>");
  }

  if (analysis.detected.entrypoints.length > 0) {
    sections.push("<section><h2>Entrypoints</h2><ul>");
    for (const entrypoint of analysis.detected.entrypoints) {
      sections.push(`<li><code>${escapeHtml(entrypoint)}</code></li>`);
    }
    sections.push("</ul></section>");
  }

  if (analysis.detected.configFiles.length > 0) {
    sections.push(
      "<section><h2>Key Config Files</h2><table><thead><tr><th>Path</th><th>Type</th><th>Confidence</th></tr></thead><tbody>"
    );

    for (const configFile of analysis.detected.configFiles) {
      sections.push(
        `<tr><td><code>${escapeHtml(configFile.path)}</code></td><td>${escapeHtml(
          configFile.type
        )}</td><td>${escapeHtml(configFile.confidence)}</td></tr>`
      );
    }

    sections.push("</tbody></table></section>");
  }

  const topologyHints = collectTopologyHints(analysis);
  if (topologyHints.length > 0) {
    sections.push("<section><h2>Repository Topology Hints</h2><ul>");
    for (const topologyHint of topologyHints) {
      sections.push(`<li><code>${escapeHtml(topologyHint)}</code></li>`);
    }
    sections.push("</ul></section>");
  }

  if (analysis.detected.envVars.length > 0) {
    sections.push(
      "<section><h2>Environment Variables</h2><table><thead><tr><th>Name</th><th>Source</th><th>Confidence</th></tr></thead><tbody>"
    );
    for (const envVar of getDisplayEnvVars(analysis.detected.envVars)) {
      sections.push(
        `<tr><td><code>${escapeHtml(envVar.name)}</code></td><td><code>${escapeHtml(
          envVar.sourceFile
        )}</code></td><td>${escapeHtml(envVar.confidence)}</td></tr>`
      );
    }
    const omittedCount = getOmittedEnvVarCount(analysis.detected.envVars);

    if (omittedCount > 0) {
      sections.push(
        `<tr><td colspan="3">${omittedCount} additional environment variables omitted from this summary.</td></tr>`
      );
    }

    sections.push("</tbody></table></section>");
  }

  if (analysis.evidence.length > 0) {
    sections.push(
      "<section><h2>Evidence</h2><table><thead><tr><th>Claim</th><th>Source</th><th>Confidence</th></tr></thead><tbody>"
    );
    for (const evidence of analysis.evidence) {
      sections.push(
        `<tr><td><code>${escapeHtml(evidence.claim)}</code></td><td><code>${escapeHtml(
          evidence.sourceFile
        )}</code></td><td>${escapeHtml(evidence.confidence)}</td></tr>`
      );
    }
    sections.push("</tbody></table></section>");
  }

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <title>${title}</title>`,
    "  <style>",
    "    body { font-family: system-ui, sans-serif; margin: 32px; line-height: 1.5; color: #1f2937; background: #f8fafc; }",
    "    main { max-width: 960px; margin: 0 auto; }",
    "    section { background: white; border: 1px solid #dbeafe; border-radius: 12px; padding: 20px; margin-bottom: 16px; }",
    "    h1, h2 { margin-top: 0; }",
    "    code { background: #eff6ff; padding: 2px 6px; border-radius: 6px; }",
    "    table { width: 100%; border-collapse: collapse; }",
    "    th, td { text-align: left; padding: 8px; border-top: 1px solid #e5e7eb; vertical-align: top; }",
    "    th { background: #f9fafb; }",
    "  </style>",
    "</head>",
    "<body>",
    "<main>",
    `  <h1>${title}</h1>`,
    ...sections,
    "</main>",
    "</body>",
    "</html>",
    ""
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function collectTopologyHints(analysis: RepoAnalysis): string[] {
  const hints = new Set<string>();

  for (const entrypoint of analysis.detected.entrypoints) {
    const directory = path.dirname(entrypoint);
    if (directory !== ".") {
      hints.add(directory);
    }
  }

  for (const envVar of analysis.detected.envVars) {
    const directory = path.dirname(envVar.sourceFile);
    if (directory !== ".") {
      hints.add(directory);
    }
  }

  for (const evidence of analysis.evidence) {
    const directory = path.dirname(evidence.sourceFile);
    if (directory !== ".") {
      hints.add(directory);
    }
  }

  return [...hints].sort();
}
