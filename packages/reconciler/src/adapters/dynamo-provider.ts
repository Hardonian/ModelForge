import {
  ExecutionProvider,
  ProviderCapabilities,
  ExecutionDryRunResult,
} from "./execution-provider";
import {
  InferenceDeploymentSpec,
  RollbackPlan,
  OptimizationAction,
} from "@modelforge/benchmark-schema";

export class DynamoExecutionProvider implements ExecutionProvider {
  name = "dynamo";
  capabilities: ProviderCapabilities = {
    supports_canary: true,
    supports_traffic_split: true,
    supports_rollback: true,
    supports_scale: true,
    supports_revision_update: true,
    supports_topology_change: true,
    supports_health_probe: true,
    supports_shadow: true,
  };

  async dryRun(action: OptimizationAction): Promise<ExecutionDryRunResult> {
    const prefillDiff = `prefill_workers: ${action.current_spec.prefill_workers ?? 1} -> ${action.target_spec.prefill_workers ?? 2}`;
    const decodeDiff = `decode_workers: ${action.current_spec.decode_workers ?? 1} -> ${action.target_spec.decode_workers ?? 2}`;

    return {
      valid: true,
      diff: `NVIDIA Dynamo Mesh Plan:\n  ${prefillDiff}\n  ${decodeDiff}\n  kv_cache_routing: disaggregated`,
      warnings: [],
      estimated_duration_s: 120,
    };
  }

  async provisionCandidate(
    actionId: string,
    _targetSpec: InferenceDeploymentSpec
  ): Promise<{ success: boolean; candidateId: string; error?: string }> {
    return { success: true, candidateId: `dynamo-cand-${actionId.slice(0, 8)}` };
  }

  async warmupCandidate(
    _candidateId: string
  ): Promise<{ ready: boolean; warmupDurationMs: number; error?: string }> {
    return { ready: true, warmupDurationMs: 400 };
  }

  async setTrafficSplit(
    _deploymentId: string,
    _candidateId: string,
    candidateTrafficPct: number,
    _shadowEnabled?: boolean
  ): Promise<{ success: boolean; activePct: number; candidatePct: number; error?: string }> {
    return {
      success: true,
      activePct: 100 - candidateTrafficPct,
      candidatePct: candidateTrafficPct,
    };
  }

  async promoteCandidate(
    _deploymentId: string,
    _candidateId: string
  ): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async rollback(
    _deploymentId: string,
    _candidateId: string,
    _rollbackPlan: RollbackPlan
  ): Promise<{ success: boolean; restoredLastKnownGood: boolean; error?: string }> {
    return { success: true, restoredLastKnownGood: true };
  }

  async drainAndDecommission(
    _deploymentId: string,
    _targetId: string
  ): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
}
