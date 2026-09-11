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

export interface VertexEndpointConfig {
  projectId: string;
  region: string;
  endpointId: string;
  acceleratorType?:
    | "TPU_V5e"
    | "TPU_V5P"
    | "TPU_V6E"
    | "NVIDIA_TESLA_A100"
    | "NVIDIA_L4"
    | "NVIDIA_H100_80GB";
  acceleratorCount?: number;
  machineType?: string;
  minReplicaCount?: number;
  maxReplicaCount?: number;
}

export interface VertexDeployedModel {
  deployedModelId: string;
  modelResourceName: string;
  trafficPercentage: number;
  isCandidate: boolean;
  status: "deploying" | "serving" | "draining" | "undeployed";
  dedicatedResources: {
    machineType: string;
    acceleratorType: string;
    acceleratorCount: number;
    minReplicaCount: number;
    maxReplicaCount: number;
  };
}

export class GoogleVertexExecutionProvider implements ExecutionProvider {
  name = "google-vertex-ai";
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

  private config: VertexEndpointConfig;
  private deployedModels: Map<string, VertexDeployedModel> = new Map();
  private activeModelId: string;

  constructor(
    config: VertexEndpointConfig = {
      projectId: "modelforge-prod-gcp",
      region: "us-central1",
      endpointId: "endpoint-vertex-v1",
      acceleratorType: "TPU_V5P",
      acceleratorCount: 4,
      machineType: "ct5p-hightpu-4t",
      minReplicaCount: 1,
      maxReplicaCount: 4,
    }
  ) {
    this.config = config;
    this.activeModelId = "model-vertex-initial-v1";
    this.deployedModels.set(this.activeModelId, {
      deployedModelId: this.activeModelId,
      modelResourceName: `projects/${this.config.projectId}/locations/${this.config.region}/models/${this.activeModelId}`,
      trafficPercentage: 100,
      isCandidate: false,
      status: "serving",
      dedicatedResources: {
        machineType: this.config.machineType ?? "ct5p-hightpu-4t",
        acceleratorType: this.config.acceleratorType ?? "TPU_V5P",
        acceleratorCount: this.config.acceleratorCount ?? 4,
        minReplicaCount: this.config.minReplicaCount ?? 1,
        maxReplicaCount: this.config.maxReplicaCount ?? 4,
      },
    });
  }

  getEndpointStatus() {
    return {
      endpointResource: `projects/${this.config.projectId}/locations/${this.config.region}/endpoints/${this.config.endpointId}`,
      activeModelId: this.activeModelId,
      models: Array.from(this.deployedModels.values()),
      trafficSplit: Object.fromEntries(
        Array.from(this.deployedModels.entries()).map(([k, v]) => [k, v.trafficPercentage])
      ),
    };
  }

  async dryRun(action: OptimizationAction): Promise<ExecutionDryRunResult> {
    const safeModelName = action.target_spec.model.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
    const candidateModelId = `vertex-cand-${safeModelName}-${action.action_id.slice(0, 6)}`;
    const accelerator = this.config.acceleratorType ?? "TPU_V5P";
    const accCount = this.config.acceleratorCount ?? 4;

    const restPayload = {
      endpoint: `projects/${this.config.projectId}/locations/${this.config.region}/endpoints/${this.config.endpointId}`,
      deployedModel: {
        id: candidateModelId,
        model: `projects/${this.config.projectId}/locations/${this.config.region}/models/${safeModelName}`,
        displayName: `${action.target_spec.model}@${action.target_spec.revision}`,
        dedicatedResources: {
          machineSpec: {
            machineType: this.config.machineType ?? "ct5p-hightpu-4t",
            acceleratorType: accelerator,
            acceleratorCount: accCount,
          },
          minReplicaCount: this.config.minReplicaCount ?? 1,
          maxReplicaCount: this.config.maxReplicaCount ?? 4,
        },
        enableAccessLogging: true,
        enableContainerLogging: true,
      },
      trafficSplit: {
        [this.activeModelId]: 99,
        [candidateModelId]: 1,
      },
    };

    const gcloudCli = `gcloud ai endpoints deploy-model ${this.config.endpointId} \\
  --project=${this.config.projectId} \\
  --region=${this.config.region} \\
  --model=${safeModelName} \\
  --display-name="${action.target_spec.model}" \\
  --machine-type=${this.config.machineType ?? "ct5p-hightpu-4t"} \\
  --accelerator=type=${accelerator},count=${accCount} \\
  --min-replica-count=${this.config.minReplicaCount ?? 1} \\
  --max-replica-count=${this.config.maxReplicaCount ?? 4} \\
  --traffic-split=0=99,${candidateModelId}=1`;

    const diff = `Google Cloud Vertex AI Canary Deployment Plan:
  Endpoint: projects/${this.config.projectId}/locations/${this.config.region}/endpoints/${this.config.endpointId}
  Active Model: ${this.activeModelId} (100% -> 99%)
  Candidate Model: ${candidateModelId} (0% -> 1%)
  Hardware: ${accCount}x ${accelerator} (${this.config.machineType ?? "ct5p-hightpu-4t"})
  CLI Command:
    ${gcloudCli.split("\n").join("\n    ")}
  REST Payload Specification:
${JSON.stringify(restPayload, null, 4)
  .split("\n")
  .map((l) => "    " + l)
  .join("\n")}`;

    return {
      valid: true,
      diff,
      warnings:
        accelerator.startsWith("TPU")
          ? ["TPU v5/v6 instances require reservation quotas in target GCP project/region"]
          : [],
      estimated_duration_s: 180,
    };
  }

  async provisionCandidate(
    actionId: string,
    targetSpec: InferenceDeploymentSpec
  ): Promise<{ success: boolean; candidateId: string; error?: string }> {
    const safeModelName = targetSpec.model.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
    const candidateId = `vertex-cand-${safeModelName}-${actionId.slice(0, 6)}`;

    this.deployedModels.set(candidateId, {
      deployedModelId: candidateId,
      modelResourceName: `projects/${this.config.projectId}/locations/${this.config.region}/models/${safeModelName}`,
      trafficPercentage: 0,
      isCandidate: true,
      status: "deploying",
      dedicatedResources: {
        machineType: this.config.machineType ?? "ct5p-hightpu-4t",
        acceleratorType: this.config.acceleratorType ?? "TPU_V5P",
        acceleratorCount: this.config.acceleratorCount ?? 4,
        minReplicaCount: this.config.minReplicaCount ?? 1,
        maxReplicaCount: this.config.maxReplicaCount ?? 4,
      },
    });

    return { success: true, candidateId };
  }

  async warmupCandidate(
    candidateId: string
  ): Promise<{ ready: boolean; warmupDurationMs: number; error?: string }> {
    const candidate = this.deployedModels.get(candidateId);
    if (!candidate) {
      return { ready: false, warmupDurationMs: 0, error: `Candidate ${candidateId} not found` };
    }

    candidate.status = "serving";
    return { ready: true, warmupDurationMs: 450 };
  }

  async setTrafficSplit(
    _deploymentId: string,
    candidateId: string,
    candidateTrafficPct: number,
    _shadowEnabled?: boolean
  ): Promise<{ success: boolean; activePct: number; candidatePct: number; error?: string }> {
    const candidate = this.deployedModels.get(candidateId);
    const active = this.deployedModels.get(this.activeModelId);

    if (!candidate) {
      return {
        success: false,
        activePct: 100,
        candidatePct: 0,
        error: `Candidate model ${candidateId} not found on Vertex AI endpoint`,
      };
    }

    const clampedCandidatePct = Math.max(0, Math.min(100, candidateTrafficPct));
    const activePct = 100 - clampedCandidatePct;

    candidate.trafficPercentage = clampedCandidatePct;
    if (active) {
      active.trafficPercentage = activePct;
    }

    return {
      success: true,
      activePct,
      candidatePct: clampedCandidatePct,
    };
  }

  async promoteCandidate(
    _deploymentId: string,
    candidateId: string
  ): Promise<{ success: boolean; error?: string }> {
    const candidate = this.deployedModels.get(candidateId);
    if (!candidate) {
      return { success: false, error: `Candidate model ${candidateId} not found for promotion` };
    }

    const previousActive = this.deployedModels.get(this.activeModelId);
    if (previousActive) {
      previousActive.trafficPercentage = 0;
      previousActive.status = "draining";
    }

    candidate.trafficPercentage = 100;
    candidate.isCandidate = false;
    this.activeModelId = candidateId;

    return { success: true };
  }

  async rollback(
    _deploymentId: string,
    candidateId: string,
    _rollbackPlan: RollbackPlan
  ): Promise<{ success: boolean; restoredLastKnownGood: boolean; error?: string }> {
    const candidate = this.deployedModels.get(candidateId);
    if (candidate) {
      candidate.trafficPercentage = 0;
      candidate.status = "draining";
    }

    const active = this.deployedModels.get(this.activeModelId);
    if (active) {
      active.trafficPercentage = 100;
      active.status = "serving";
    }

    return { success: true, restoredLastKnownGood: true };
  }

  async drainAndDecommission(
    _deploymentId: string,
    targetId: string
  ): Promise<{ success: boolean; error?: string }> {
    const target = this.deployedModels.get(targetId);
    if (target && targetId !== this.activeModelId) {
      target.status = "undeployed";
      target.trafficPercentage = 0;
      this.deployedModels.delete(targetId);
    }
    return { success: true };
  }
}
