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

export const CommandRoleSchema = z.enum([
  "dev",
  "build",
  "test",
  "lint",
  "typecheck",
  "format",
  "other"
]);

export const CommandCandidateSchema = z.object({
  name: z.string(),
  role: CommandRoleSchema,
  command: z.string(),
  rawScript: z.string().optional(),
  source: z.string(),
  confidence: ConfidenceLevelSchema
});

export const DirectoryRoleSchema = z.enum(["source", "workspace", "scripts", "other"]);

export const DirectoryCandidateSchema = z.object({
  path: z.string(),
  role: DirectoryRoleSchema,
  source: z.string(),
  confidence: ConfidenceLevelSchema
});

export const EntrypointRoleSchema = z.enum([
  "source",
  "package-output",
  "cli",
  "generated",
  "other"
]);

export const EntrypointCandidateSchema = z.object({
  path: z.string(),
  role: EntrypointRoleSchema,
  source: z.string(),
  confidence: ConfidenceLevelSchema,
  reason: z.string().optional()
});

export const ConfigFileTypeSchema = z.enum([
  "typescript",
  "framework",
  "lint",
  "format",
  "test",
  "bundler",
  "ci",
  "container",
  "environment",
  "package",
  "workspace",
  "other"
]);

export const ConfigFileSchema = z.object({
  path: z.string(),
  type: ConfigFileTypeSchema,
  confidence: ConfidenceLevelSchema
});

export const EnvVarSchema = z.object({
  name: z.string(),
  sourceFile: z.string(),
  confidence: ConfidenceLevelSchema
});

export const DocumentationFileTypeSchema = z.enum([
  "readme",
  "license",
  "changelog",
  "contributing",
  "code-of-conduct",
  "docs",
  "examples"
]);

export const DocumentationFileSchema = z.object({
  path: z.string(),
  type: DocumentationFileTypeSchema,
  confidence: ConfidenceLevelSchema
});

export const PackageMetadataSchema = z.object({
  path: z.string(),
  name: z.string().optional(),
  version: z.string().optional(),
  private: z.boolean().optional(),
  hasRepository: z.boolean(),
  hasBugs: z.boolean(),
  hasHomepage: z.boolean(),
  hasBin: z.boolean(),
  hasPublishConfig: z.boolean(),
  confidence: ConfidenceLevelSchema
});

export const DemoSignalTypeSchema = z.enum(["route", "asset", "example"]);

export const DemoSignalSchema = z.object({
  path: z.string(),
  type: DemoSignalTypeSchema,
  source: z.string(),
  confidence: ConfidenceLevelSchema
});

export const WorkspaceInfoSchema = z.object({
  isWorkspace: z.boolean(),
  packageGlobs: z.array(z.string()).default([]),
  signals: z.array(z.string()).default([]),
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
    workspace: WorkspaceInfoSchema.optional(),
    scripts: z.array(ScriptCommandSchema).default([]),
    commands: z.array(CommandCandidateSchema).default([]),
    directories: z.array(DirectoryCandidateSchema).default([]),
    configFiles: z.array(ConfigFileSchema).default([]),
    entrypoints: z.array(z.string()).default([]),
    entrypointFacts: z.array(EntrypointCandidateSchema).default([]).optional(),
    envVars: z.array(EnvVarSchema).default([]),
    docs: z.array(DocumentationFileSchema).default([]),
    packageMetadata: PackageMetadataSchema.optional(),
    demoSignals: z.array(DemoSignalSchema).default([])
  }),
  evidence: z.array(EvidenceRecordSchema).default([])
});

export type RepoAnalysis = z.infer<typeof RepoAnalysisSchema>;
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;
export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;
export type ScriptCommand = z.infer<typeof ScriptCommandSchema>;
export type CommandRole = z.infer<typeof CommandRoleSchema>;
export type CommandCandidate = z.infer<typeof CommandCandidateSchema>;
export type DirectoryRole = z.infer<typeof DirectoryRoleSchema>;
export type DirectoryCandidate = z.infer<typeof DirectoryCandidateSchema>;
export type EntrypointRole = z.infer<typeof EntrypointRoleSchema>;
export type EntrypointCandidate = z.infer<typeof EntrypointCandidateSchema>;
export type ConfigFileType = z.infer<typeof ConfigFileTypeSchema>;
export type ConfigFile = z.infer<typeof ConfigFileSchema>;
export type EnvVar = z.infer<typeof EnvVarSchema>;
export type DocumentationFileType = z.infer<typeof DocumentationFileTypeSchema>;
export type DocumentationFile = z.infer<typeof DocumentationFileSchema>;
export type PackageMetadata = z.infer<typeof PackageMetadataSchema>;
export type DemoSignalType = z.infer<typeof DemoSignalTypeSchema>;
export type DemoSignal = z.infer<typeof DemoSignalSchema>;
export type WorkspaceInfo = z.infer<typeof WorkspaceInfoSchema>;
