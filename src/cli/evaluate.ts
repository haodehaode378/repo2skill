#!/usr/bin/env node

import { Command } from "commander";
import { loadEvaluationManifest } from "../core/evaluations/loadEvaluationManifest.js";
import {
  renderEvaluationSummary,
  runEvaluationManifest
} from "../core/evaluations/runEvaluationManifest.js";
import type { OutputFormat } from "../core/run/runLocalAnalysis.js";

const program = new Command();

program
  .name("repo2skill-evaluate")
  .description("Run artifact-level context evaluations against a manifest.")
  .argument("<manifest>", "Path to evaluation manifest JSON")
  .option("-o, --out <dir>", "Output directory", "./evaluation-out")
  .option("--cache-dir <dir>", "Directory for cached GitHub clones")
  .option("--format <format>", "json|md|all", "all")
  .action(
    async (
      manifestPath: string,
      options: {
        out: string;
        cacheDir?: string;
        format: OutputFormat;
      }
    ) => {
      const manifest = await loadEvaluationManifest(manifestPath);
      const summary = await runEvaluationManifest(manifest, {
        outDir: options.out,
        format: options.format,
        cacheDir: options.cacheDir
      });

      console.log(renderEvaluationSummary(summary));

      if (summary.failureCount > 0) {
        process.exitCode = 1;
      }
    }
  );

await program.parseAsync(process.argv);
