#!/usr/bin/env node

import { Command } from "commander";
import { compareBenchmarkToBaseline, renderBenchmarkComparison } from "../core/benchmarks/compareBenchmarkBaseline.js";
import { exportBenchmarkBaseline } from "../core/benchmarks/exportBenchmarkBaseline.js";
import { exportBenchmarkComparison } from "../core/benchmarks/exportBenchmarkComparison.js";
import { loadBenchmarkBaseline } from "../core/benchmarks/loadBenchmarkBaseline.js";
import { loadBenchmarkManifest } from "../core/benchmarks/loadBenchmarkManifest.js";
import {
  renderBenchmarkSummary,
  runBenchmarkManifest
} from "../core/benchmarks/runBenchmarkManifest.js";
import type { OutputFormat } from "../core/run/runLocalAnalysis.js";

const program = new Command();

program
  .name("repo2skill-benchmark")
  .description("Run repo2skill against a benchmark manifest.")
  .argument("<manifest>", "Path to benchmark manifest JSON")
  .option("-o, --out <dir>", "Output directory", "./benchmark-out")
  .option("--cache-dir <dir>", "Directory for cached GitHub clones")
  .option("--baseline-out <file>", "Write a stable benchmark summary JSON to this file")
  .option("--compare <file>", "Compare the current benchmark run with a baseline JSON file")
  .option("--compare-out <file>", "Write the compare result JSON to this file")
  .option("--format <format>", "json|md|all", "all")
  .action(
    async (
      manifestPath: string,
      options: {
        out: string;
        cacheDir?: string;
        baselineOut?: string;
        compare?: string;
        compareOut?: string;
        format: OutputFormat;
      }
    ) => {
      const manifest = await loadBenchmarkManifest(manifestPath);
      const summary = await runBenchmarkManifest(manifest, {
        outDir: options.out,
        format: options.format,
        cacheDir: options.cacheDir
      });

      if (options.baselineOut) {
        await exportBenchmarkBaseline(options.baselineOut, summary);
      }

      console.log(renderBenchmarkSummary(summary));

      let hasRegressions = false;

      if (options.compare) {
        const baseline = await loadBenchmarkBaseline(options.compare);
        const comparison = compareBenchmarkToBaseline(summary, baseline);

        if (options.compareOut) {
          await exportBenchmarkComparison(options.compareOut, comparison);
        }

        console.log("");
        console.log(renderBenchmarkComparison(comparison));
        hasRegressions = comparison.regressionCount > 0;
      }

      if (summary.failureCount > 0 || hasRegressions) {
        process.exitCode = 1;
      }
    }
  );

await program.parseAsync(process.argv);
