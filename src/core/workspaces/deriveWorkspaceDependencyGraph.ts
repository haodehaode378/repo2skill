import path from "node:path";
import fs from "fs-extra";
import type {
  RepoAnalysis,
  WorkspaceDependencyEdge,
  WorkspaceDependencyType,
  WorkspaceDiagnostic,
  WorkspacePackage,
  WorkspacePackageReference
} from "../../schemas/analysis.js";

const DEPENDENCY_SECTIONS = [
  ["dependencies", "dependency"],
  ["devDependencies", "devDependency"],
  ["peerDependencies", "peerDependency"],
  ["optionalDependencies", "optionalDependency"]
] as const satisfies ReadonlyArray<readonly [string, WorkspaceDependencyType]>;

export async function deriveWorkspaceDependencyGraph(
  rootDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  const workspace = analysis.detected.workspace;
  const packages = workspace?.packages;

  if (!workspace || !packages || packages.length === 0) {
    return;
  }

  const { packagesByName, diagnostics } = indexUniquePackages(packages);
  const edges: WorkspaceDependencyEdge[] = [];

  for (const workspacePackage of packages) {
    const packageJson = await readPackageJson(
      path.join(rootDir, ...workspacePackage.packageJsonPath.split("/"))
    );

    if (!packageJson || !workspacePackage.name || !packagesByName.has(workspacePackage.name)) {
      continue;
    }

    for (const [sectionName, dependencyType] of DEPENDENCY_SECTIONS) {
      const dependencies = readDependencyNames(packageJson[sectionName]);

      for (const dependencyName of dependencies) {
        const targetPackage = packagesByName.get(dependencyName);

        if (!targetPackage) {
          continue;
        }

        edges.push({
          sourcePackagePath: workspacePackage.path,
          sourcePackageName: workspacePackage.name,
          targetPackagePath: targetPackage.path,
          targetPackageName: dependencyName,
          dependencyType,
          sourceFile: workspacePackage.packageJsonPath,
          confidence: "high"
        });
      }
    }
  }

  workspace.dependencyEdges = sortEdges(edges);
  workspace.diagnostics = diagnostics;
  workspace.packages = attachPackageRelationships(packages, workspace.dependencyEdges);

  for (const edge of workspace.dependencyEdges) {
    analysis.evidence.push({
      claim: `workspaceDependency=${edge.sourcePackageName}->${edge.targetPackageName}:${edge.dependencyType}`,
      sourceFile: edge.sourceFile,
      reason: `Detected internal ${edge.dependencyType}`,
      confidence: edge.confidence
    });
  }
}

function indexUniquePackages(packages: WorkspacePackage[]): {
  packagesByName: Map<string, WorkspacePackage>;
  diagnostics: WorkspaceDiagnostic[];
} {
  const candidates = new Map<string, WorkspacePackage[]>();

  for (const workspacePackage of packages) {
    if (!workspacePackage.name) {
      continue;
    }

    const namedPackages = candidates.get(workspacePackage.name) ?? [];
    namedPackages.push(workspacePackage);
    candidates.set(workspacePackage.name, namedPackages);
  }

  const packagesByName = new Map<string, WorkspacePackage>();
  const diagnostics: WorkspaceDiagnostic[] = [];

  for (const [packageName, namedPackages] of [...candidates.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  )) {
    const sortedPackages = [...namedPackages].sort((left, right) =>
      left.path.localeCompare(right.path)
    );

    if (sortedPackages.length === 1) {
      packagesByName.set(packageName, sortedPackages[0]);
      continue;
    }

    diagnostics.push({
      code: "duplicate-package-name",
      message: `Workspace package name ${packageName} is declared by multiple paths`,
      packagePaths: sortedPackages.map((workspacePackage) => workspacePackage.path),
      sourceFiles: sortedPackages.map((workspacePackage) => workspacePackage.packageJsonPath),
      confidence: "high"
    });
  }

  return { packagesByName, diagnostics };
}

function readDependencyNames(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.keys(value).sort();
}

function sortEdges(edges: WorkspaceDependencyEdge[]): WorkspaceDependencyEdge[] {
  return [...edges].sort((left, right) =>
    [left.sourcePackagePath, left.targetPackagePath, left.dependencyType]
      .join("\0")
      .localeCompare(
        [right.sourcePackagePath, right.targetPackagePath, right.dependencyType].join("\0")
      )
  );
}

function attachPackageRelationships(
  packages: WorkspacePackage[],
  edges: WorkspaceDependencyEdge[]
): WorkspacePackage[] {
  const dependencies = new Map<string, Map<string, WorkspacePackageReference>>();
  const consumers = new Map<string, Map<string, WorkspacePackageReference>>();

  for (const edge of edges) {
    registerReference(dependencies, edge.sourcePackagePath, {
      path: edge.targetPackagePath,
      name: edge.targetPackageName
    });
    registerReference(consumers, edge.targetPackagePath, {
      path: edge.sourcePackagePath,
      name: edge.sourcePackageName
    });
  }

  return packages.map((workspacePackage) => ({
    ...workspacePackage,
    directDependencies: sortedReferences(dependencies.get(workspacePackage.path)),
    directConsumers: sortedReferences(consumers.get(workspacePackage.path))
  }));
}

function registerReference(
  references: Map<string, Map<string, WorkspacePackageReference>>,
  packagePath: string,
  reference: WorkspacePackageReference
): void {
  const packageReferences = references.get(packagePath) ?? new Map();
  packageReferences.set(reference.path, reference);
  references.set(packagePath, packageReferences);
}

function sortedReferences(
  references: Map<string, WorkspacePackageReference> | undefined
): WorkspacePackageReference[] {
  return references
    ? [...references.values()].sort((left, right) => left.path.localeCompare(right.path))
    : [];
}

async function readPackageJson(
  packageJsonPath: string
): Promise<Record<string, unknown> | undefined> {
  try {
    return (await fs.readJson(packageJsonPath)) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
