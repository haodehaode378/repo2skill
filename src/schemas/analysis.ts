import { z } from "zod";

export const ConfidenceLevelSchema = z.enum(["high", "medium", "low"]);

export const EvidenceRecordSchema = z.object({
  claim: z.string(),
  sourceFile: z.string(),
  reason: z.string().optional(),
  confidence: ConfidenceLevelSchema
});

export const ScriptCommandSchema = z.object({
  name: z.string(),
  command: z.string(),
  confidence: ConfidenceLevelSchema
});

export const EnvVarSchema = z.object({
  name: z.string(),
  sourceFile: z.string(),
  confidence: ConfidenceLevelSchema
});

export const RepoAnalysisSchema = z.object({
  repo: z.object({
    input: z.string(),
    rootDir: z.string(),
    name: z.string()
  }),
  detected: z.object({
    packageManager: z.string().optional(),
    projectType: z.string().optional(),
    workspace: z.boolean().optional(),
    scripts: z.array(ScriptCommandSchema).default([]),
    entrypoints: z.array(z.string()).default([]),
    envVars: z.array(EnvVarSchema).default([])
  }),
  evidence: z.array(EvidenceRecordSchema).default([])
});

export type RepoAnalysis = z.infer<typeof RepoAnalysisSchema>;
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;
export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;
export type ScriptCommand = z.infer<typeof ScriptCommandSchema>;
export type EnvVar = z.infer<typeof EnvVarSchema>;
