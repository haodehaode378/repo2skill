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

export const EvaluationFactAssertionsSchema = z.object({
  expectedEntrypoints: z.array(z.string()).default([]),
  forbiddenEntrypoints: z.array(z.string()).default([]),
  expectedImportantDirectories: z.array(z.string()).default([]),
  forbiddenImportantDirectories: z.array(z.string()).default([]),
  expectedCommands: z.array(z.string()).default([]),
  expectedConfigFiles: z.array(z.string()).default([])
});

export const EvaluationCaseSchema = z
  .object({
    name: z.string(),
    input: z.string(),
    branch: z.string().optional(),
    assertions: z.array(EvaluationAssertionSchema).default([]),
    facts: EvaluationFactAssertionsSchema.optional()
  })
  .refine(
    (evaluationCase) =>
      evaluationCase.assertions.length > 0 || hasFactAssertions(evaluationCase.facts),
    "Each evaluation case must contain artifact or semantic fact assertions"
  );

export const EvaluationManifestSchema = z.object({
  name: z.string(),
  cases: z.array(EvaluationCaseSchema).min(1)
});

export type EvaluationArtifact = z.infer<typeof EvaluationArtifactSchema>;
export type EvaluationAssertion = z.infer<typeof EvaluationAssertionSchema>;
export type EvaluationFactAssertions = z.infer<typeof EvaluationFactAssertionsSchema>;
export type EvaluationCase = z.infer<typeof EvaluationCaseSchema>;
export type EvaluationManifest = z.infer<typeof EvaluationManifestSchema>;

function hasFactAssertions(facts: z.infer<typeof EvaluationFactAssertionsSchema> | undefined) {
  return facts != null && Object.values(facts).some((values) => values.length > 0);
}
