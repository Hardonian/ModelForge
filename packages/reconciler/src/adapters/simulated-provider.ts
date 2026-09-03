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

export class SimulatedExecutionProvider implements ExecutionProvider {
  name = "simulated";
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

  private activeCandidates = new Map<
    string,
    { candidateId: string; spec: InferenceDeploymentSpec; ready: boolean; trafficPct: number }
  >();
  private failureModes = new Set<string>();

  injectFailure(mode: "warmup" | "traffic_split" | "promote" | "rollback"): void {
    this.failureModes.add(mode);
  }

  clearFailures(): void {
    this.failureModes.clear();
  }

  async dryRun(action: OptimizationAction): Promise<ExecutionDryRunResult> {
    const diff = [
      `--- current (${action.current_spec.model}:${action.current_spec.runtime})`,
      `+++ proposed (${action.target_spec.model}:${action.target_spec.runtime})`,
      `@@ accelerator: ${action.current_spec.accelerator} x${action.current_spec.accelerator_count} -> ${action.target_spec.accelerator} x${action.target_spec.accelerator_count}`,
      `@@ replicas: ${action.current_spec.replicas} -> ${action.target_spec.replicas}`,
      `@@ precision: ${action.current_spec.precision} -> ${action.target_spec.precision}`,
    ].join("\n");

    const warnings: string[] = [];
    if (action.risk.level === "high" || action.risk.level === "critical") {
      warnings.push(`High risk change detected: ${action.risk.reasons.join("; ")}`);
    }

    return {
      valid: true,
      diff,
      warnings,
      estimated_duration_s: 180,
    };
  }

  async provisionCandidate(
    actionId: string,
    targetSpec: InferenceDeploymentSpec
  ): Promise<{ success: boolean; candidateId: string; error?: string }> {
    const candidateId = `cand-${actionId.slice(0, 8)}-${Date.now().toString(36)}`;
    this.activeCandidates.set(candidateId, {
      candidateId,
      spec: targetSpec,
      ready: false,
      trafficPct: 0,
    });
    return { success: true, candidateId };
  }

  async warmupCandidate(
    candidateId: string
  ): Promise<{ ready: boolean; warmupDurationMs: number; error?: string }> {
    if (this.failureModes.has("warmup")) {
      return {
        ready: false,
        warmupDurationMs: 5000,
        error: "Simulated CUDA engine warmup failed: Out of VRAM during graph capture",
      };
    }
    const cand = this.activeCandidates.get(candidateId);
    if (!cand) return { ready: false, warmupDurationMs: 0, error: "Candidate not found" };

    cand.ready = true;
    return { ready: true, warmupDurationMs: 450 };
  }

  async setTrafficSplit(
    _deploymentId: string,
    candidateId: string,
    candidateTrafficPct: number,
    _shadowEnabled?: boolean
  ): Promise<{ success: boolean; activePct: number; candidatePct: number; error?: string }> {
    if (this.failureModes.has("traffic_split")) {
      return {
        success: false,
        activePct: 100,
        candidatePct: 0,
        error: "Simulated router failed to update traffic split",
      };
    }
    const cand = this.activeCandidates.get(candidateId);
    if (cand) {
      cand.trafficPct = candidateTrafficPct;
    }
    return {
      success: true,
      activePct: 100 - candidateTrafficPct,
      candidatePct: candidateTrafficPct,
    };
  }

  async promoteCandidate(
    _deploymentId: string,
    candidateId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (this.failureModes.has("promote")) {
      return {
        success: false,
        error: "Simulated cluster failed to promote candidate to primary active deployment",
      };
    }
    const cand = this.activeCandidates.get(candidateId);
    if (cand) {
      cand.trafficPct = 100;
    }
    return { success: true };
  }

  async rollback(
    _deploymentId: string,
    candidateId: string,
    _rollbackPlan: RollbackPlan
  ): Promise<{ success: boolean; restoredLastKnownGood: boolean; error?: string }> {
    if (this.failureModes.has("rollback")) {
      return {
        success: false,
        restoredLastKnownGood: false,
        error: "Critical failure during rollback restoration",
      };
    }
    const cand = this.activeCandidates.get(candidateId);
    if (cand) {
      cand.trafficPct = 0;
      cand.ready = false;
    }
    return { success: true, restoredLastKnownGood: true };
  }

  async drainAndDecommission(
    _deploymentId: string,
    targetId: string
  ): Promise<{ success: boolean; error?: string }> {
    this.activeCandidates.delete(targetId);
    return { success: true };
  }
}
