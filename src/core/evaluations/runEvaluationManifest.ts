import path from "node:path";
import fs from "fs-extra";
import type {
  EvaluationCase,
  EvaluationManifest
} from "../../schemas/evaluation.js";
import { materializeRepository } from "../collect/materializeRepository.js";
import { resolveInput } from "../collect/resolveInput.js";
import {
  analyzeLocalRepo,
  exportAnalysisArtifacts,
  type OutputFormat
} from "../run/runLocalAnalysis.js";

export type EvaluationFailure = {
  artifact: string;
  expected?: string;
  unexpected?: string;
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
          lines.push(`  missing ${failure.artifact}: ${failure.expected}`);
        }

        if (failure.unexpected) {
          lines.push(`  unexpected ${failure.artifact}: ${failure.unexpected}`);
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

    const analysis = await analyze(rootDir);
    await exportArtifacts(options.outDir, analysis, format);

    const failures = await collectAssertionFailures(options.outDir, evaluationCase);

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

async function collectAssertionFailures(
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
          expected
        });
      }
    }

    for (const unexpected of assertion.excludes) {
      if (content.includes(unexpected)) {
        failures.push({
          artifact: assertion.artifact,
          unexpected
        });
      }
    }
  }

  return failures;
}
