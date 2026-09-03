import {
  InferenceDeploymentSpec,
  RollbackPlan,
  OptimizationAction,
} from "@modelforge/benchmark-schema";

export interface ProviderCapabilities {
  supports_canary: boolean;
  supports_traffic_split: boolean;
  supports_rollback: boolean;
  supports_scale: boolean;
  supports_revision_update: boolean;
  supports_topology_change: boolean;
  supports_health_probe: boolean;
  supports_shadow: boolean;
}

export interface ExecutionDryRunResult {
  valid: boolean;
  diff: string;
  warnings: string[];
  estimated_duration_s: number;
}

export interface ExecutionProvider {
  name: string;
  capabilities: ProviderCapabilities;

  dryRun(action: OptimizationAction): Promise<ExecutionDryRunResult>;

  provisionCandidate(
    actionId: string,
    targetSpec: InferenceDeploymentSpec
  ): Promise<{ success: boolean; candidateId: string; error?: string }>;

  warmupCandidate(
    candidateId: string
  ): Promise<{ ready: boolean; warmupDurationMs: number; error?: string }>;

  setTrafficSplit(
    deploymentId: string,
    candidateId: string,
    candidateTrafficPct: number,
    shadowEnabled?: boolean
  ): Promise<{ success: boolean; activePct: number; candidatePct: number; error?: string }>;

  promoteCandidate(
    deploymentId: string,
    candidateId: string
  ): Promise<{ success: boolean; error?: string }>;

  rollback(
    deploymentId: string,
    candidateId: string,
    rollbackPlan: RollbackPlan
  ): Promise<{ success: boolean; restoredLastKnownGood: boolean; error?: string }>;

  drainAndDecommission(
    deploymentId: string,
    targetId: string
  ): Promise<{ success: boolean; error?: string }>;
}
