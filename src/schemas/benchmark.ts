import { z } from "zod";

export const BenchmarkRepoSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  branch: z.string().optional()
});

export const BenchmarkManifestSchema = z.object({
  name: z.string(),
  repos: z.array(BenchmarkRepoSchema).min(1)
});

export const BenchmarkBaselineRepoSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  branch: z.string().optional(),
  success: z.boolean(),
  packageManager: z.string().optional(),
  projectType: z.string().optional(),
  scriptCount: z.number().int().nonnegative().optional(),
  entrypointCount: z.number().int().nonnegative().optional(),
  envVarCount: z.number().int().nonnegative().optional(),
  error: z.string().optional()
});

export const BenchmarkBaselineSchema = z.object({
  manifestName: z.string(),
  generatedAt: z.string(),
  format: z.enum(["json", "md", "all"]),
  repoCount: z.number().int().nonnegative(),
  successCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
  repos: z.array(BenchmarkBaselineRepoSchema)
});

export const BenchmarkComparisonDeltaSchema = z.object({
  field: z.enum([
    "repo",
    "url",
    "branch",
    "success",
    "packageManager",
    "projectType",
    "scriptCount",
    "entrypointCount",
    "envVarCount"
  ]),
  kind: z.enum(["regression", "improvement"]),
  baselineValue: z.union([z.boolean(), z.number(), z.string()]).optional(),
  currentValue: z.union([z.boolean(), z.number(), z.string()]).optional()
});

export const BenchmarkRepoComparisonSchema = z.object({
  name: z.string(),
  status: z.enum(["unchanged", "regression", "improvement"]),
  deltas: z.array(BenchmarkComparisonDeltaSchema)
});

export const BenchmarkComparisonSchema = z.object({
  manifestName: z.string(),
  baselineGeneratedAt: z.string(),
  baselineRepoCount: z.number().int().nonnegative(),
  currentRepoCount: z.number().int().nonnegative(),
  unchangedCount: z.number().int().nonnegative(),
  regressionCount: z.number().int().nonnegative(),
  improvementCount: z.number().int().nonnegative(),
  comparisons: z.array(BenchmarkRepoComparisonSchema)
});

export type BenchmarkRepo = z.infer<typeof BenchmarkRepoSchema>;
export type BenchmarkManifest = z.infer<typeof BenchmarkManifestSchema>;
export type BenchmarkBaselineRepo = z.infer<typeof BenchmarkBaselineRepoSchema>;
export type BenchmarkBaseline = z.infer<typeof BenchmarkBaselineSchema>;
export type BenchmarkComparisonDelta = z.infer<typeof BenchmarkComparisonDeltaSchema>;
export type BenchmarkRepoComparison = z.infer<typeof BenchmarkRepoComparisonSchema>;
export type BenchmarkComparison = z.infer<typeof BenchmarkComparisonSchema>;
