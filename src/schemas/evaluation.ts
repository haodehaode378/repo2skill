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

export const EvaluationDependencyAssertionSchema = z.object({
  sourcePackage: z.string(),
  targetPackage: z.string(),
  dependencyType: z.enum(["dependency", "devDependency", "peerDependency", "optionalDependency"])
});

export const EvaluationPackageCommandAssertionSchema = z.object({
  package: z.string(),
  command: z.string(),
  cwd: z.string()
});

export const EvaluationPackagePathAssertionSchema = z.object({
  package: z.string(),
  path: z.string()
});

export const EvaluationFactAssertionsSchema = z.object({
  expectedEntrypoints: z.array(z.string()).default([]),
  forbiddenEntrypoints: z.array(z.string()).default([]),
  expectedImportantDirectories: z.array(z.string()).default([]),
  forbiddenImportantDirectories: z.array(z.string()).default([]),
  expectedCommands: z.array(z.string()).default([]),
  expectedConfigFiles: z.array(z.string()).default([]),
  expectedWorkspacePackages: z.array(z.string()).default([]),
  forbiddenWorkspacePackages: z.array(z.string()).default([]),
  expectedWorkspacePackagePaths: z.array(z.string()).default([]),
  forbiddenWorkspacePackagePaths: z.array(z.string()).default([]),
  expectedInternalDependencies: z.array(EvaluationDependencyAssertionSchema).default([]),
  forbiddenInternalDependencies: z.array(EvaluationDependencyAssertionSchema).default([]),
  expectedPackageCommands: z.array(EvaluationPackageCommandAssertionSchema).default([]),
  forbiddenPackageCommands: z.array(EvaluationPackageCommandAssertionSchema).default([]),
  expectedPackageEntrypoints: z.array(EvaluationPackagePathAssertionSchema).default([]),
  forbiddenPackageEntrypoints: z.array(EvaluationPackagePathAssertionSchema).default([]),
  expectedPackageImportantDirectories: z.array(EvaluationPackagePathAssertionSchema).default([]),
  forbiddenPackageImportantDirectories: z.array(EvaluationPackagePathAssertionSchema).default([]),
  expectedFocusedPackage: z.string().optional()
});

export const EvaluationCaseSchema = z
  .object({
    name: z.string(),
    input: z.string(),
    branch: z.string().optional(),
    package: z.string().optional(),
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
export type EvaluationDependencyAssertion = z.infer<typeof EvaluationDependencyAssertionSchema>;
export type EvaluationPackageCommandAssertion = z.infer<
  typeof EvaluationPackageCommandAssertionSchema
>;
export type EvaluationPackagePathAssertion = z.infer<typeof EvaluationPackagePathAssertionSchema>;
export type EvaluationFactAssertions = z.infer<typeof EvaluationFactAssertionsSchema>;
export type EvaluationCase = z.infer<typeof EvaluationCaseSchema>;
export type EvaluationManifest = z.infer<typeof EvaluationManifestSchema>;

function hasFactAssertions(facts: z.infer<typeof EvaluationFactAssertionsSchema> | undefined) {
  return (
    facts != null &&
    Object.values(facts).some((value) =>
      Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.length > 0
    )
  );
}
