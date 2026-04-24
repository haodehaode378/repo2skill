import type {
  EntrypointCandidate,
  EntrypointRole,
  RepoAnalysis
} from "../../schemas/analysis.js";

export function getEntrypointFacts(analysis: RepoAnalysis): EntrypointCandidate[] {
  if (analysis.detected.entrypointFacts && analysis.detected.entrypointFacts.length > 0) {
    return analysis.detected.entrypointFacts;
  }

  return analysis.detected.entrypoints.map((entrypoint) => ({
    path: entrypoint,
    role: getLegacyEntrypointRole(entrypoint),
    source: entrypoint,
    confidence: "medium"
  }));
}

export function isGeneratedEntrypointRole(role: EntrypointRole): boolean {
  return role === "generated" || role === "package-output";
}

function getLegacyEntrypointRole(entrypoint: string): EntrypointRole {
  const normalized = entrypoint.replace(/^\.\//, "");

  if (normalized === "src" || normalized.startsWith("src/")) {
    return "source";
  }

  if (
    normalized === "dist" ||
    normalized.startsWith("dist/") ||
    normalized === "build" ||
    normalized.startsWith("build/") ||
    normalized === "out" ||
    normalized.startsWith("out/") ||
    normalized === "coverage" ||
    normalized.startsWith("coverage/")
  ) {
    return "generated";
  }

  return "other";
}
