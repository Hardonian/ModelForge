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

export type GkeTpuAcceleratorType =
  | "tpu-v5p-slice"
  | "tpu-v6e-slice"
  | "tpu-v5e-slice";

export type GkeTpuTopology =
  | "2x2x1"
  | "2x2x2"
  | "2x2x4"
  | "2x4x4"
  | "4x4x4";

export interface GkeTpuClusterConfig {
  clusterName: string;
  project: string;
  region: string;
  namespace: string;
  tpuType: GkeTpuAcceleratorType;
  topology: GkeTpuTopology;
  chipCount: number;
  runtime: "xla" | "vllm-tpu" | "jax";
}

export class GkeTpuExecutionProvider implements ExecutionProvider {
  name = "gke-tpu-multislice";
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

  private config: GkeTpuClusterConfig;
  private activeCandidateTraffic: Map<string, number> = new Map();
  private activeServiceId: string;

  constructor(
    config: GkeTpuClusterConfig = {
      clusterName: "gke-tpu-prod-central",
      project: "modelforge-prod-gcp",
      region: "us-central1-a",
      namespace: "modelforge-serving",
      tpuType: "tpu-v5p-slice",
      topology: "2x2x1",
      chipCount: 4,
      runtime: "vllm-tpu",
    }
  ) {
    this.config = config;
    this.activeServiceId = "gke-tpu-active-v1";
    this.activeCandidateTraffic.set(this.activeServiceId, 100);
  }

  getConfig(): GkeTpuClusterConfig {
    return { ...this.config };
  }

  async dryRun(action: OptimizationAction): Promise<ExecutionDryRunResult> {
    const safeModel = action.target_spec.model.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
    const candidateId = `gke-tpu-${safeModel}-${action.action_id.slice(0, 6)}`;
    const tp = action.target_spec.tensor_parallelism ?? this.config.chipCount;

    const manifestYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${candidateId}
  namespace: ${this.config.namespace}
  labels:
    app.kubernetes.io/name: modelforge-tpu-serving
    model.modelforge.dev/id: "${safeModel}"
    model.modelforge.dev/topology: "${this.config.topology}"
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${candidateId}
  template:
    metadata:
      labels:
        app: ${candidateId}
      annotations:
        gke.cloud.google.com/tpu-topology: "${this.config.topology}"
    spec:
      nodeSelector:
        cloud.google.com/gke-tpu-accelerator: "${this.config.tpuType}"
        cloud.google.com/gke-tpu-topology: "${this.config.topology}"
      containers:
      - name: tpu-engine
        image: vllm/vllm-tpu:v0.6.4
        env:
        - name: PJRT_DEVICE
          value: "TPU"
        - name: TPU_CHIPS_PER_HOST_BOUNDS
          value: "${this.config.topology.replace(/x/g, ",")}"
        - name: MODEL_ID
          value: "${action.target_spec.model}"
        - name: TENSOR_PARALLEL_SIZE
          value: "${tp}"
        resources:
          limits:
            google.com/tpu: ${this.config.chipCount}
            memory: 64Gi
            cpu: 16
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: ${safeModel}-tpu-route
  namespace: ${this.config.namespace}
spec:
  rules:
  - backendRefs:
    - name: ${this.activeServiceId}
      port: 8000
      weight: 99
    - name: ${candidateId}
      port: 8000
      weight: 1`;

    const diff = `GKE Cloud TPU Multislice Topology Transition:
  Cluster: ${this.config.clusterName} (${this.config.region})
  TPU Accelerator: ${this.config.tpuType} (Optical ICI Switch Interconnect)
  Slice Topology: ${this.config.topology} (${this.config.chipCount} TPU Chips)
  Gateway HTTPRoute Traffic Split:
    ${this.activeServiceId}: 100% -> 99%
    ${candidateId}: 0% -> 1%
  Kubernetes Manifest:
${manifestYaml
  .split("\n")
  .map((l) => "    " + l)
  .join("\n")}`;

    return {
      valid: true,
      diff,
      warnings: [
        "GKE TPU multislice requires Google Cloud GKE v1.28+ with TPU provisioner enabled",
        "ICI optical switch links require co-located pods in the same reservation block",
      ],
      estimated_duration_s: 90,
    };
  }

  async provisionCandidate(
    actionId: string,
    targetSpec: InferenceDeploymentSpec
  ): Promise<{ success: boolean; candidateId: string; error?: string }> {
    const safeModel = targetSpec.model.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
    const candidateId = `gke-tpu-${safeModel}-${actionId.slice(0, 6)}`;
    this.activeCandidateTraffic.set(candidateId, 0);
    return { success: true, candidateId };
  }

  async warmupCandidate(
    candidateId: string
  ): Promise<{ ready: boolean; warmupDurationMs: number; error?: string }> {
    if (!this.activeCandidateTraffic.has(candidateId)) {
      return { ready: false, warmupDurationMs: 0, error: `Candidate ${candidateId} not found` };
    }
    // Simulate GKE TPU XLA compilation and HBM allocation
    return { ready: true, warmupDurationMs: 380 };
  }

  async setTrafficSplit(
    _deploymentId: string,
    candidateId: string,
    candidateTrafficPct: number,
    _shadowEnabled?: boolean
  ): Promise<{ success: boolean; activePct: number; candidatePct: number; error?: string }> {
    if (!this.activeCandidateTraffic.has(candidateId)) {
      return {
        success: false,
        activePct: 100,
        candidatePct: 0,
        error: `Candidate ${candidateId} does not exist on GKE cluster`,
      };
    }

    const clampedCandidate = Math.max(0, Math.min(100, candidateTrafficPct));
    const activePct = 100 - clampedCandidate;

    this.activeCandidateTraffic.set(candidateId, clampedCandidate);
    this.activeCandidateTraffic.set(this.activeServiceId, activePct);

    return {
      success: true,
      activePct,
      candidatePct: clampedCandidate,
    };
  }

  async promoteCandidate(
    _deploymentId: string,
    candidateId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.activeCandidateTraffic.has(candidateId)) {
      return { success: false, error: `Candidate ${candidateId} not found` };
    }

    this.activeCandidateTraffic.set(this.activeServiceId, 0);
    this.activeCandidateTraffic.set(candidateId, 100);
    this.activeServiceId = candidateId;

    return { success: true };
  }

  async rollback(
    _deploymentId: string,
    candidateId: string,
    _rollbackPlan: RollbackPlan
  ): Promise<{ success: boolean; restoredLastKnownGood: boolean; error?: string }> {
    this.activeCandidateTraffic.set(candidateId, 0);
    this.activeCandidateTraffic.set(this.activeServiceId, 100);
    return { success: true, restoredLastKnownGood: true };
  }

  async drainAndDecommission(
    _deploymentId: string,
    targetId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (targetId !== this.activeServiceId) {
      this.activeCandidateTraffic.delete(targetId);
    }
    return { success: true };
  }
}
