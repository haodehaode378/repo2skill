import type {
  BenchmarkBaseline,
  BenchmarkBaselineRepo,
  BenchmarkComparison,
  BenchmarkComparisonDelta,
  BenchmarkRepoComparison
} from "../../schemas/benchmark.js";
import type { BenchmarkSummary, BenchmarkRepoResult } from "./runBenchmarkManifest.js";

export function compareBenchmarkToBaseline(
  current: BenchmarkSummary,
  baseline: BenchmarkBaseline
): BenchmarkComparison {
  const baselineRepos = new Map(baseline.repos.map((repo) => [repo.name, repo]));
  const currentRepos = new Map(current.results.map((repo) => [repo.name, repo]));
  const comparisons: BenchmarkRepoComparison[] = [];

  for (const baselineRepo of baseline.repos) {
    const currentRepo = currentRepos.get(baselineRepo.name);
    comparisons.push(compareSingleRepo(baselineRepo, currentRepo));
  }

  for (const currentRepo of current.results) {
    if (!baselineRepos.has(currentRepo.name)) {
      comparisons.push({
        name: currentRepo.name,
        status: "improvement",
        deltas: [
          {
            field: "repo",
            kind: "improvement",
            currentValue: currentRepo.name
          }
        ]
      });
    }
  }

  const unchangedCount = comparisons.filter((comparison) => comparison.status === "unchanged").length;
  const regressionCount = comparisons.filter((comparison) => comparison.status === "regression").length;
  const improvementCount = comparisons.filter((comparison) => comparison.status === "improvement").length;

  return {
    manifestName: current.manifestName,
    baselineGeneratedAt: baseline.generatedAt,
    baselineRepoCount: baseline.repoCount,
    currentRepoCount: current.repoCount,
    unchangedCount,
    regressionCount,
    improvementCount,
    comparisons
  };
}

export function renderBenchmarkComparison(comparison: BenchmarkComparison): string {
  const lines = [
    `Baseline manifest: ${comparison.manifestName}`,
    `Baseline generated at: ${comparison.baselineGeneratedAt}`,
    `Baseline repos: ${comparison.baselineRepoCount}`,
    `Current repos: ${comparison.currentRepoCount}`,
    `Unchanged: ${comparison.unchangedCount}`,
    `Regressions: ${comparison.regressionCount}`,
    `Improvements: ${comparison.improvementCount}`
  ];

  const changedComparisons = comparison.comparisons.filter(
    (repoComparison) => repoComparison.status !== "unchanged"
  );

  if (changedComparisons.length > 0) {
    lines.push("Changes:");

    for (const repoComparison of changedComparisons) {
      const deltas = repoComparison.deltas.map((delta) => {
        const baselineValue = formatDeltaValue(delta.baselineValue);
        const currentValue = formatDeltaValue(delta.currentValue);
        return `${delta.kind}:${delta.field} ${baselineValue} -> ${currentValue}`;
      });

      lines.push(`- ${repoComparison.name}: ${deltas.join("; ")}`);
    }
  }

  return lines.join("\n");
}

function compareSingleRepo(
  baselineRepo: BenchmarkBaselineRepo,
  currentRepo?: BenchmarkRepoResult
): BenchmarkRepoComparison {
  if (!currentRepo) {
    return {
      name: baselineRepo.name,
      status: "regression",
      deltas: [
        {
          field: "repo",
          kind: "regression",
          baselineValue: baselineRepo.name
        }
      ]
    };
  }

  const deltas: BenchmarkComparisonDelta[] = [];

  compareStringField(deltas, "url", baselineRepo.url, currentRepo.url);
  compareStringField(deltas, "branch", baselineRepo.branch, currentRepo.branch);
  compareBooleanField(deltas, "success", baselineRepo.success, currentRepo.success);
  compareStringField(deltas, "packageManager", baselineRepo.packageManager, currentRepo.packageManager);
  compareStringField(deltas, "projectType", baselineRepo.projectType, currentRepo.projectType);
  compareOptionalBooleanField(deltas, "workspace", baselineRepo.workspace, currentRepo.workspace);
  compareCountField(deltas, "scriptCount", baselineRepo.scriptCount, currentRepo.scriptCount);
  compareCountField(deltas, "commandCount", baselineRepo.commandCount, currentRepo.commandCount);
  compareCountField(deltas, "configFileCount", baselineRepo.configFileCount, currentRepo.configFileCount);
  compareCountField(deltas, "entrypointCount", baselineRepo.entrypointCount, currentRepo.entrypointCount);
  compareCountField(deltas, "envVarCount", baselineRepo.envVarCount, currentRepo.envVarCount);

  if (deltas.some((delta) => delta.kind === "regression")) {
    return {
      name: baselineRepo.name,
      status: "regression",
      deltas
    };
  }

  if (deltas.some((delta) => delta.kind === "improvement")) {
    return {
      name: baselineRepo.name,
      status: "improvement",
      deltas
    };
  }

  return {
    name: baselineRepo.name,
    status: "unchanged",
    deltas: []
  };
}

function compareStringField(
  deltas: BenchmarkComparisonDelta[],
  field: BenchmarkComparisonDelta["field"],
  baselineValue?: string,
  currentValue?: string
): void {
  if (baselineValue === currentValue) {
    return;
  }

  if (baselineValue && !currentValue) {
    deltas.push({ field, kind: "regression", baselineValue, currentValue });
    return;
  }

  if (!baselineValue && currentValue) {
    deltas.push({ field, kind: "improvement", baselineValue, currentValue });
    return;
  }

  if (baselineValue && currentValue) {
    deltas.push({ field, kind: "regression", baselineValue, currentValue });
  }
}

function compareBooleanField(
  deltas: BenchmarkComparisonDelta[],
  field: BenchmarkComparisonDelta["field"],
  baselineValue: boolean,
  currentValue: boolean
): void {
  if (baselineValue === currentValue) {
    return;
  }

  deltas.push({
    field,
    kind: currentValue ? "improvement" : "regression",
    baselineValue,
    currentValue
  });
}

function compareOptionalBooleanField(
  deltas: BenchmarkComparisonDelta[],
  field: BenchmarkComparisonDelta["field"],
  baselineValue?: boolean,
  currentValue?: boolean
): void {
  if (baselineValue === currentValue) {
    return;
  }

  if (typeof baselineValue === "boolean" && typeof currentValue !== "boolean") {
    deltas.push({ field, kind: "regression", baselineValue, currentValue });
    return;
  }

  if (typeof baselineValue !== "boolean" && typeof currentValue === "boolean") {
    deltas.push({ field, kind: "improvement", baselineValue, currentValue });
    return;
  }

  if (typeof baselineValue === "boolean" && typeof currentValue === "boolean") {
    deltas.push({
      field,
      kind: currentValue ? "improvement" : "regression",
      baselineValue,
      currentValue
    });
  }
}

function compareCountField(
  deltas: BenchmarkComparisonDelta[],
  field: BenchmarkComparisonDelta["field"],
  baselineValue?: number,
  currentValue?: number
): void {
  if (baselineValue === currentValue) {
    return;
  }

  if (typeof baselineValue === "number" && typeof currentValue !== "number") {
    deltas.push({ field, kind: "regression", baselineValue, currentValue });
    return;
  }

  if (typeof baselineValue !== "number" && typeof currentValue === "number") {
    deltas.push({ field, kind: "improvement", baselineValue, currentValue });
    return;
  }

  if (typeof baselineValue === "number" && typeof currentValue === "number") {
    deltas.push({
      field,
      kind: currentValue > baselineValue ? "improvement" : "regression",
      baselineValue,
      currentValue
    });
  }
}

function formatDeltaValue(value?: boolean | number | string): string {
  if (value === undefined) {
    return "undefined";
  }

  return String(value);
}
