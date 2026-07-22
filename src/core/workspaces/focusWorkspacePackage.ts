import type {
  EvidenceRecord,
  RepoAnalysis,
  WorkspaceDependencyEdge,
  WorkspacePackage
} from "../../schemas/analysis.js";

export function focusWorkspacePackage(analysis: RepoAnalysis, selector: string): RepoAnalysis {
  const workspace = analysis.detected.workspace;
  const packages = workspace?.packages ?? [];

  if (!workspace || packages.length === 0) {
    throw new Error("--package requires a repository with discovered workspace packages");
  }

  const normalizedSelector = normalizePackageSelector(selector);
  const matches = uniquePackages(
    packages.filter(
      (workspacePackage) =>
        workspacePackage.name === selector.trim() || workspacePackage.path === normalizedSelector
    )
  );

  if (matches.length === 0) {
    throw new Error(
      `Workspace package ${JSON.stringify(selector)} was not found. Available packages: ${formatAvailablePackages(packages)}`
    );
  }

  if (matches.length > 1) {
    throw new Error(
      `Workspace package ${JSON.stringify(selector)} is ambiguous. Candidates: ${formatAvailablePackages(matches)}`
    );
  }

  const focusedPackage = matches[0];
  const includedPaths = new Set([
    focusedPackage.path,
    ...(focusedPackage.directDependencies ?? []).map((reference) => reference.path),
    ...(focusedPackage.directConsumers ?? []).map((reference) => reference.path)
  ]);
  const focusedPackages = packages.filter((workspacePackage) =>
    includedPaths.has(workspacePackage.path)
  );
  const includedNames = new Set(
    focusedPackages.flatMap((workspacePackage) =>
      workspacePackage.name ? [workspacePackage.name] : []
    )
  );
  const includedPackageJsonPaths = new Set(
    focusedPackages.map((workspacePackage) => workspacePackage.packageJsonPath)
  );
  const allPackagePaths = packages.map((workspacePackage) => workspacePackage.path);

  return {
    ...analysis,
    detected: {
      ...analysis.detected,
      envVars: analysis.detected.envVars.filter((envVar) =>
        isRootOrIncludedPackagePath(envVar.sourceFile, allPackagePaths, includedPaths)
      ),
      auditFindings: analysis.detected.auditFindings?.filter((finding) =>
        isRootOrIncludedPackagePath(finding.path, allPackagePaths, includedPaths)
      ),
      workspace: {
        ...workspace,
        packages: focusedPackages,
        dependencyEdges: (workspace.dependencyEdges ?? []).filter((edge) =>
          isIncludedEdge(edge, includedPaths)
        ),
        diagnostics: (workspace.diagnostics ?? []).filter((diagnostic) =>
          diagnostic.packagePaths.some((packagePath) => includedPaths.has(packagePath))
        ),
        focusedPackage: {
          path: focusedPackage.path,
          name: focusedPackage.name
        }
      }
    },
    evidence: analysis.evidence.filter((evidence) =>
      isIncludedEvidence(
        evidence,
        includedPaths,
        includedNames,
        includedPackageJsonPaths,
        allPackagePaths
      )
    )
  };
}

export function normalizePackageSelector(selector: string): string {
  return selector.trim().replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
}

function uniquePackages(packages: WorkspacePackage[]): WorkspacePackage[] {
  return [
    ...new Map(
      packages.map((workspacePackage) => [workspacePackage.path, workspacePackage])
    ).values()
  ];
}

function formatAvailablePackages(packages: WorkspacePackage[]): string {
  return packages
    .map((workspacePackage) =>
      workspacePackage.name
        ? `${workspacePackage.name} (${workspacePackage.path})`
        : workspacePackage.path
    )
    .sort()
    .join(", ");
}

function isIncludedEdge(edge: WorkspaceDependencyEdge, includedPaths: Set<string>): boolean {
  return includedPaths.has(edge.sourcePackagePath) && includedPaths.has(edge.targetPackagePath);
}

function isIncludedEvidence(
  evidence: EvidenceRecord,
  includedPaths: Set<string>,
  includedNames: Set<string>,
  includedPackageJsonPaths: Set<string>,
  allPackagePaths: string[]
): boolean {
  const packageClaim = evidence.claim.match(/^workspacePackage\[([^\]]+)\]\./);

  if (packageClaim) {
    return includedPaths.has(packageClaim[1]);
  }

  const commandClaim = evidence.claim.match(/^workspacePackageCommand\[([^\]]+)\]=/);

  if (commandClaim) {
    return includedPaths.has(commandClaim[1]);
  }

  const dependencyClaim = evidence.claim.match(/^workspaceDependency=([^>]+)->([^:]+):/);

  if (dependencyClaim) {
    return includedNames.has(dependencyClaim[1]) && includedNames.has(dependencyClaim[2]);
  }

  if (evidence.claim.startsWith("workspacePackage=")) {
    return includedPackageJsonPaths.has(evidence.sourceFile);
  }

  return isRootOrIncludedPackagePath(evidence.sourceFile, allPackagePaths, includedPaths);
}

function isRootOrIncludedPackagePath(
  filePath: string,
  allPackagePaths: string[],
  includedPaths: Set<string>
): boolean {
  const normalized = filePath.replace(/\\/g, "/").replace(/^\.\//, "");
  const owningPackage = allPackagePaths.find(
    (packagePath) => normalized === packagePath || normalized.startsWith(`${packagePath}/`)
  );
  return !owningPackage || includedPaths.has(owningPackage);
}
