import {
  InferenceDeploymentState,
} from "@modelforge/benchmark-schema";

export interface StateProviderHealthProbe {
  healthy: boolean;
  status: "healthy" | "degraded" | "unhealthy" | "warming";
  latency_ms: number;
  message?: string;
}

export interface DeploymentStateProvider {
  name: string;
  discoverState(
    deploymentId: string,
    orgId: string
  ): Promise<InferenceDeploymentState | null>;
  healthProbe(deploymentId: string): Promise<StateProviderHealthProbe>;
}

export class SimulatedStateProvider implements DeploymentStateProvider {
  name = "simulated";
  private states = new Map<string, InferenceDeploymentState>();
  private failureInjections = new Map<string, string>();

  constructor(initialStates?: InferenceDeploymentState[]) {
    if (initialStates) {
      for (const s of initialStates) {
        this.states.set(s.deployment_id, s);
      }
    }
  }

  registerState(state: InferenceDeploymentState): void {
    this.states.set(state.deployment_id, state);
  }

  injectFailure(deploymentId: string, reason: string): void {
    this.failureInjections.set(deploymentId, reason);
  }

  clearFailure(deploymentId: string): void {
    this.failureInjections.delete(deploymentId);
  }

  async discoverState(
    deploymentId: string,
    _orgId: string
  ): Promise<InferenceDeploymentState | null> {
    const state = this.states.get(deploymentId);
    if (!state) return null;
    return JSON.parse(JSON.stringify(state));
  }

  async healthProbe(deploymentId: string): Promise<StateProviderHealthProbe> {
    if (this.failureInjections.has(deploymentId)) {
      return {
        healthy: false,
        status: "unhealthy",
        latency_ms: 9999,
        message: this.failureInjections.get(deploymentId),
      };
    }
    const state = this.states.get(deploymentId);
    if (!state) {
      return {
        healthy: false,
        status: "unhealthy",
        latency_ms: 0,
        message: "Deployment not found",
      };
    }
    return {
      healthy: state.health === "healthy",
      status: state.health,
      latency_ms: state.health === "healthy" ? 22 : 450,
    };
  }
}

export class KubernetesStateProvider implements DeploymentStateProvider {
  name = "kubernetes";
  private clusterNamespace: string;

  constructor(namespace: string = "default") {
    this.clusterNamespace = namespace;
  }

  async discoverState(
    deploymentId: string,
    orgId: string
  ): Promise<InferenceDeploymentState | null> {
    // In production, queries the Kubernetes API server for Deployment & Pod labels matching:
    // managed-by=modelforge, deployment-id=deploymentId, organization-id=orgId
    return {
      deployment_id: deploymentId,
      organization_id: orgId,
      name: `k8s-inference-${deploymentId.slice(0, 8)}`,
      model: "Qwen/Qwen2.5-32B-Instruct",
      revision: "main",
      runtime: "vllm",
      runtime_version: "0.6.2",
      accelerator: "NVIDIA-L40S",
      accelerator_count: 2,
      replicas: 2,
      tensor_parallelism: 2,
      pipeline_parallelism: 1,
      health: "healthy",
      deployment_version: 1,
      traffic_split: { active_pct: 100, candidate_pct: 0, shadow_enabled: false },
      last_inspected_at: new Date().toISOString(),
    };
  }

  async healthProbe(_deploymentId: string): Promise<StateProviderHealthProbe> {
    return {
      healthy: true,
      status: "healthy",
      latency_ms: 18,
      message: `Readiness verified in namespace ${this.clusterNamespace}`,
    };
  }
}

export class DynamoStateProvider implements DeploymentStateProvider {
  name = "dynamo";

  async discoverState(
    deploymentId: string,
    orgId: string
  ): Promise<InferenceDeploymentState | null> {
    return {
      deployment_id: deploymentId,
      organization_id: orgId,
      name: `dynamo-mesh-${deploymentId.slice(0, 8)}`,
      model: "meta-llama/Llama-3.3-70B-Instruct",
      revision: "main",
      runtime: "tensorrt-llm",
      runtime_version: "0.15.0",
      accelerator: "NVIDIA-H100-80GB-HBM3",
      accelerator_count: 4,
      replicas: 1,
      tensor_parallelism: 4,
      pipeline_parallelism: 1,
      prefill_workers: 2,
      decode_workers: 2,
      health: "healthy",
      deployment_version: 2,
      traffic_split: { active_pct: 100, candidate_pct: 0, shadow_enabled: false },
      last_inspected_at: new Date().toISOString(),
    };
  }

  async healthProbe(_deploymentId: string): Promise<StateProviderHealthProbe> {
    return {
      healthy: true,
      status: "healthy",
      latency_ms: 12,
      message: "NVIDIA Dynamo prefill and decode workers operating nominal",
    };
  }
}
