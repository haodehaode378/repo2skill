import { z } from "zod";

export const VisualAssetKindSchema = z.enum(["readme-hero", "skill-card", "architecture-poster"]);

export const VisualBriefSchema = z.object({
  projectName: z.string(),
  projectType: z.string().optional(),
  packageManager: z.string().optional(),
  primaryUseCase: z.string(),
  audience: z.array(z.string()),
  visualTone: z.array(z.string()),
  evidenceSummary: z.array(z.string()),
  constraints: z.array(z.string())
});

export const VisualAssetSpecSchema = z.object({
  id: z.string(),
  kind: VisualAssetKindSchema,
  title: z.string(),
  purpose: z.string(),
  size: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive()
  }),
  prompt: z.string(),
  negativePrompt: z.string().optional(),
  evidenceRefs: z.array(z.string()).min(1),
  outputPath: z.string().optional()
});

export const VisualAssetManifestSchema = z.object({
  generatedAt: z.string(),
  mode: z.literal("prompts"),
  source: z.object({
    repository: z.string(),
    analysis: z.literal("repo2skill.json")
  }),
  assets: z.array(VisualAssetSpecSchema)
});

export type VisualAssetKind = z.infer<typeof VisualAssetKindSchema>;
export type VisualBrief = z.infer<typeof VisualBriefSchema>;
export type VisualAssetSpec = z.infer<typeof VisualAssetSpecSchema>;
export type VisualAssetManifest = z.infer<typeof VisualAssetManifestSchema>;
