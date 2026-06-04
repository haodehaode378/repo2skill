#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import { auditRepository, renderAuditReport } from "../core/audit/auditRepository.js";
import { materializeRepository } from "../core/collect/materializeRepository.js";
import { resolveInput } from "../core/collect/resolveInput.js";
import {
  analyzeLocalRepo,
  exportAnalysisArtifacts,
  renderAnalysisSummary,
  type OutputFormat,
  type OutputProfile,
  type VisualMode
} from "../core/run/runLocalAnalysis.js";
import type { VisualAssetKind } from "../schemas/visual.js";
import {
  parseOutputFormat,
  parseOutputProfile,
  parseVisualAssets,
  parseVisualMode
} from "./options.js";

const program = new Command();

program
  .name("repo2skill")
  .description("Turn any GitHub repo into agent-ready onboarding context.")
  .argument("<input>", "GitHub repository URL or local path")
  .option("-o, --out <dir>", "Output directory", "./out")
  .option("--cache-dir <dir>", "Directory for cached GitHub clones")
  .option("--refresh", "Refresh cached GitHub clones before analyzing")
  .option(
    "--no-cache",
    "Clone GitHub repositories into a temporary directory and remove it after analysis"
  )
  .option("--format <format>", "json|md|all", parseOutputFormat, "all")
  .option(
    "--profile <profile>",
    "onboarding|release-check|course-report|demo|issue-to-pr|all",
    parseOutputProfile,
    "onboarding"
  )
  .option("--issue-file <file>", "Issue markdown/text file for the issue-to-pr profile")
  .option("--branch <branch>", "Git branch to clone for GitHub repository inputs")
  .option("--summary-only", "Analyze and print the summary without writing output files")
  .option("--audit-only", "Run trust and safety checks without generating artifacts")
  .option("--visual", "Generate an evidence-backed visual prompt asset pack")
  .option("--visual-mode <mode>", "prompts", parseVisualMode, "prompts")
  .option(
    "--visual-assets <assets>",
    "Comma-separated visual assets: hero,skill-card,architecture",
    parseVisualAssets
  )
  .action(
    async (
      input: string,
      options: {
        out: string;
        cacheDir?: string;
        refresh?: boolean;
        cache?: boolean;
        format: OutputFormat;
        profile: OutputProfile;
        issueFile?: string;
        branch?: string;
        summaryOnly?: boolean;
        auditOnly?: boolean;
        visual?: boolean;
        visualMode: VisualMode;
        visualAssets?: VisualAssetKind[];
      }
    ) => {
      const resolved = await resolveInput(input);
      const materialized = await materializeRepository(resolved, {
        branch: options.branch,
        cacheDir: options.cacheDir,
        refresh: options.refresh,
        noCache: options.cache === false
      });

      try {
        if (options.auditOnly) {
          const findings = await auditRepository(materialized.rootDir);
          console.log(renderAuditReport(materialized.rootDir, findings));
          return;
        }

        const analysis = await analyzeLocalRepo(materialized.rootDir);
        const issueText = options.issueFile
          ? await fs.readFile(options.issueFile, "utf8")
          : undefined;
        const writtenFiles = options.summaryOnly
          ? []
          : await exportAnalysisArtifacts(options.out, analysis, options.format, options.profile, {
              issueText,
              visual: options.visual
                ? {
                    enabled: true,
                    mode: options.visualMode,
                    assets: options.visualAssets
                  }
                : undefined
            });
        console.log(
          renderAnalysisSummary(analysis, writtenFiles, {
            inputSource: resolved.source,
            materializedRootDir: materialized.rootDir
          })
        );
      } finally {
        await materialized.cleanup();
      }
    }
  );

await program.parseAsync(process.argv);
