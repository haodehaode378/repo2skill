import { z } from "zod";

export const EvaluationArtifactSchema = z.enum([
  "repo2skill.json",
  "project-map.md",
  "AGENTS.md",
  "SKILL.md",
  "quickstart.windows.md",
  "quickstart.macos.md",
  "quickstart.linux.md",
  "report.html"
]);

export const EvaluationAssertionSchema = z.object({
  artifact: EvaluationArtifactSchema,
  includes: z.array(z.string()).default([]),
  excludes: z.array(z.string()).default([])
});

export const EvaluationCaseSchema = z.object({
  name: z.string(),
  input: z.string(),
  branch: z.string().optional(),
  assertions: z.array(EvaluationAssertionSchema).min(1)
});

export const EvaluationManifestSchema = z.object({
  name: z.string(),
  cases: z.array(EvaluationCaseSchema).min(1)
});

export type EvaluationArtifact = z.infer<typeof EvaluationArtifactSchema>;
export type EvaluationAssertion = z.infer<typeof EvaluationAssertionSchema>;
export type EvaluationCase = z.infer<typeof EvaluationCaseSchema>;
export type EvaluationManifest = z.infer<typeof EvaluationManifestSchema>;
