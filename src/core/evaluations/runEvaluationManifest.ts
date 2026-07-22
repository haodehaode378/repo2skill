import path from "node:path";
import fs from "fs-extra";
import type {
  EvaluationCase,
  EvaluationDependencyAssertion,
  EvaluationManifest,
  EvaluationPackageCommandAssertion,
  EvaluationPackagePathAssertion
} from "../../schemas/evaluation.js";
import type { RepoAnalysis } from "../../schemas/analysis.js";
import { materializeRepository } from "../collect/materializeRepository.js";
import { resolveInput } from "../collect/resolveInput.js";
import {
  analyzeLocalRepo,
  exportAnalysisArtifacts,
  type OutputFormat
} from "../run/runLocalAnalysis.js";
import { focusWorkspacePackage } from "../workspaces/focusWorkspacePackage.js";

export type EvaluationFailure = {
  artifact: string;
  expected?: string;
  unexpected?: string;
  actual?: string;
};

export type EvaluationCaseResult = {
  name: string;
  input: string;
  success: boolean;
  outputDir: string;
  failureCount: number;
  failures: EvaluationFailure[];
  error?: string;
};

export type EvaluationSummary = {
  manifestName: string;
  caseCount: number;
  successCount: number;
  failureCount: number;
  results: EvaluationCaseResult[];
};

type RunEvaluationManifestOptions = {
  outDir: string;
  format?: OutputFormat;
  cacheDir?: string;
  materializeRepositoryFn?: typeof materializeRepository;
  analyzeLocalRepoFn?: typeof analyzeLocalRepo;
  exportAnalysisArtifactsFn?: typeof exportAnalysisArtifacts;
};

export async function runEvaluationManifest(
  manifest: EvaluationManifest,
  options: RunEvaluationManifestOptions
): Promise<EvaluationSummary> {
  const results: EvaluationCaseResult[] = [];

  for (const evaluationCase of manifest.cases) {
    results.push(
      await runSingleEvaluationCase(evaluationCase, {
        ...options,
        outDir: path.join(options.outDir, evaluationCase.name)
      })
    );
  }

  const successCount = results.filter((result) => result.success).length;

  return {
    manifestName: manifest.name,
    caseCount: manifest.cases.length,
    successCount,
    failureCount: manifest.cases.length - successCount,
    results
  };
}

export function renderEvaluationSummary(summary: EvaluationSummary): string {
  const lines = [
    `Evaluation manifest: ${summary.manifestName}`,
    `Cases: ${summary.caseCount}`,
    `Succeeded: ${summary.successCount}`,
    `Failed: ${summary.failureCount}`
  ];

  if (summary.results.length > 0) {
    lines.push("Results:");

    for (const result of summary.results) {
      const parts = [
        result.success ? "OK" : "FAIL",
        result.name,
        `failures=${result.failureCount}`
      ];

      if (result.error) {
        parts.push(`error=${result.error}`);
      }

      lines.push(`- ${parts.join(" | ")}`);

      for (const failure of result.failures) {
        if (failure.expected) {
          lines.push(
            `  expected ${failure.artifact}: ${failure.expected}${renderActual(failure.actual)}`
          );
        }

        if (failure.unexpected) {
          lines.push(
            `  forbidden ${failure.artifact}: ${failure.unexpected}${renderActual(failure.actual)}`
          );
        }
      }
    }
  }

  return lines.join("\n");
}

type RunSingleEvaluationCaseOptions = {
  outDir: string;
  format?: OutputFormat;
  cacheDir?: string;
  materializeRepositoryFn?: typeof materializeRepository;
  analyzeLocalRepoFn?: typeof analyzeLocalRepo;
  exportAnalysisArtifactsFn?: typeof exportAnalysisArtifacts;
};

async function runSingleEvaluationCase(
  evaluationCase: EvaluationCase,
  options: RunSingleEvaluationCaseOptions
): Promise<EvaluationCaseResult> {
  const format = options.format ?? "all";
  const materialize = options.materializeRepositoryFn ?? materializeRepository;
  const analyze = options.analyzeLocalRepoFn ?? analyzeLocalRepo;
  const exportArtifacts = options.exportAnalysisArtifactsFn ?? exportAnalysisArtifacts;
  let materialized: Awaited<ReturnType<typeof materializeRepository>> | undefined;

  try {
    const input = await resolveInput(evaluationCase.input);

    if (input.type === "github") {
      materialized = await materialize(input, {
        branch: evaluationCase.branch,
        cacheDir: options.cacheDir
      });
    }

    const rootDir = input.type === "github" ? materialized?.rootDir : input.source;

    if (!rootDir) {
      throw new Error(`Unable to materialize input: ${evaluationCase.input}`);
    }

    const fullAnalysis = await analyze(rootDir);
    const analysis = evaluationCase.package
      ? focusWorkspacePackage(fullAnalysis, evaluationCase.package)
      : fullAnalysis;
    await exportArtifacts(options.outDir, analysis, format);

    const failures = [
      ...collectFactFailures(analysis, evaluationCase),
      ...(await collectArtifactAssertionFailures(options.outDir, evaluationCase))
    ];

    return {
      name: evaluationCase.name,
      input: evaluationCase.input,
      success: failures.length === 0,
      outputDir: options.outDir,
      failureCount: failures.length,
      failures
    };
  } catch (error) {
    return {
      name: evaluationCase.name,
      input: evaluationCase.input,
      success: false,
      outputDir: options.outDir,
      failureCount: 1,
      failures: [],
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (materialized) {
      await materialized.cleanup();
    }
  }
}

async function collectArtifactAssertionFailures(
  outDir: string,
  evaluationCase: EvaluationCase
): Promise<EvaluationFailure[]> {
  const failures: EvaluationFailure[] = [];

  for (const assertion of evaluationCase.assertions) {
    const artifactPath = path.join(outDir, assertion.artifact);
    const content = await fs.readFile(artifactPath, "utf8");

    for (const expected of assertion.includes) {
      if (!content.includes(expected)) {
        failures.push({
          artifact: assertion.artifact,
          expected,
          actual: "absent"
        });
      }
    }

    for (const unexpected of assertion.excludes) {
      if (content.includes(unexpected)) {
        failures.push({
          artifact: assertion.artifact,
          unexpected,
          actual: "present"
        });
      }
    }
  }

  return failures;
}

function collectFactFailures(
  analysis: RepoAnalysis,
  evaluationCase: EvaluationCase
): EvaluationFailure[] {
  const facts = evaluationCase.facts;

  if (!facts) {
    return [];
  }

  const failures: EvaluationFailure[] = [];
  const checks = [
    {
      artifact: "facts.entrypoints",
      actual: analysis.detected.entrypoints,
      expected: facts.expectedEntrypoints,
      forbidden: facts.forbiddenEntrypoints
    },
    {
      artifact: "facts.importantDirectories",
      actual: analysis.detected.directories.map((directory) => directory.path),
      expected: facts.expectedImportantDirectories,
      forbidden: facts.forbiddenImportantDirectories
    },
    {
      artifact: "facts.commands",
      actual: analysis.detected.commands.map((command) => command.command),
      expected: facts.expectedCommands,
      forbidden: []
    },
    {
      artifact: "facts.configFiles",
      actual: analysis.detected.configFiles.map((configFile) => configFile.path),
      expected: facts.expectedConfigFiles,
      forbidden: []
    }
  ];

  for (const check of checks) {
    const actual = formatActualValues(check.actual);

    for (const expected of check.expected) {
      if (!check.actual.includes(expected)) {
        failures.push({ artifact: check.artifact, expected, actual });
      }
    }

    for (const forbidden of check.forbidden) {
      if (check.actual.includes(forbidden)) {
        failures.push({ artifact: check.artifact, unexpected: forbidden, actual });
      }
    }
  }

  failures.push(...collectWorkspaceFactFailures(analysis, evaluationCase));

  return failures;
}

function collectWorkspaceFactFailures(
  analysis: RepoAnalysis,
  evaluationCase: EvaluationCase
): EvaluationFailure[] {
  const facts = evaluationCase.facts;
  if (!facts) {
    return [];
  }

  const workspace = analysis.detected.workspace;
  const packages = workspace?.packages ?? [];
  const failures: EvaluationFailure[] = [];
  collectStringCheckFailures(
    failures,
    "facts.workspacePackages",
    packages.flatMap((workspacePackage) => (workspacePackage.name ? [workspacePackage.name] : [])),
    facts.expectedWorkspacePackages ?? [],
    facts.forbiddenWorkspacePackages ?? []
  );
  collectStringCheckFailures(
    failures,
    "facts.workspacePackagePaths",
    packages.map((workspacePackage) => workspacePackage.path),
    facts.expectedWorkspacePackagePaths ?? [],
    facts.forbiddenWorkspacePackagePaths ?? []
  );

  const actualEdges = (workspace?.dependencyEdges ?? []).map(formatDependencyEdge);
  collectStringCheckFailures(
    failures,
    "facts.internalDependencies",
    actualEdges,
    (facts.expectedInternalDependencies ?? []).map(formatDependencyAssertion),
    (facts.forbiddenInternalDependencies ?? []).map(formatDependencyAssertion)
  );

  const actualCommands = packages.flatMap((workspacePackage) =>
    (workspacePackage.commands ?? []).map((command) =>
      formatPackageCommand({
        package: workspacePackage.name ?? workspacePackage.path,
        command: command.command,
        cwd: command.cwd
      })
    )
  );
  collectStringCheckFailures(
    failures,
    "facts.packageCommands",
    actualCommands,
    (facts.expectedPackageCommands ?? []).map(formatPackageCommand),
    (facts.forbiddenPackageCommands ?? []).map(formatPackageCommand)
  );

  collectPackagePathFailures(
    failures,
    "facts.packageEntrypoints",
    packages.flatMap((workspacePackage) =>
      (workspacePackage.entrypoints ?? []).map((entrypoint) => ({
        package: workspacePackage.name ?? workspacePackage.path,
        path: entrypoint
      }))
    ),
    facts.expectedPackageEntrypoints ?? [],
    facts.forbiddenPackageEntrypoints ?? []
  );
  collectPackagePathFailures(
    failures,
    "facts.packageImportantDirectories",
    packages.flatMap((workspacePackage) =>
      (workspacePackage.directories ?? []).map((directory) => ({
        package: workspacePackage.name ?? workspacePackage.path,
        path: directory.path
      }))
    ),
    facts.expectedPackageImportantDirectories ?? [],
    facts.forbiddenPackageImportantDirectories ?? []
  );

  if (facts.expectedFocusedPackage) {
    const actualFocus = workspace?.focusedPackage;
    const actualValues = actualFocus
      ? [actualFocus.name, actualFocus.path].filter((value): value is string => Boolean(value))
      : [];
    if (!actualValues.includes(facts.expectedFocusedPackage)) {
      failures.push({
        artifact: "facts.focusedPackage",
        expected: facts.expectedFocusedPackage,
        actual: formatActualValues(actualValues)
      });
    }
  }

  return failures;
}

function collectPackagePathFailures(
  failures: EvaluationFailure[],
  artifact: string,
  actual: EvaluationPackagePathAssertion[],
  expected: EvaluationPackagePathAssertion[],
  forbidden: EvaluationPackagePathAssertion[]
): void {
  collectStringCheckFailures(
    failures,
    artifact,
    actual.map(formatPackagePath),
    expected.map(formatPackagePath),
    forbidden.map(formatPackagePath)
  );
}

function collectStringCheckFailures(
  failures: EvaluationFailure[],
  artifact: string,
  actual: string[],
  expected: string[],
  forbidden: string[]
): void {
  const actualText = formatActualValues(actual);
  for (const value of expected) {
    if (!actual.includes(value)) {
      failures.push({ artifact, expected: value, actual: actualText });
    }
  }
  for (const value of forbidden) {
    if (actual.includes(value)) {
      failures.push({ artifact, unexpected: value, actual: actualText });
    }
  }
}

function formatDependencyEdge(edge: {
  sourcePackageName: string;
  targetPackageName: string;
  dependencyType: string;
}): string {
  return `${edge.sourcePackageName} -> ${edge.targetPackageName} (${edge.dependencyType})`;
}

function formatDependencyAssertion(assertion: EvaluationDependencyAssertion): string {
  return `${assertion.sourcePackage} -> ${assertion.targetPackage} (${assertion.dependencyType})`;
}

function formatPackageCommand(assertion: EvaluationPackageCommandAssertion): string {
  return `${assertion.package}: ${assertion.command} (cwd: ${assertion.cwd})`;
}

function formatPackagePath(assertion: EvaluationPackagePathAssertion): string {
  return `${assertion.package}: ${assertion.path}`;
}

function formatActualValues(values: string[]): string {
  return values.length > 0 ? `[${values.join(", ")}]` : "[]";
}

function renderActual(actual: string | undefined): string {
  return actual ? `; actual=${actual}` : "";
}
