import type {
  OpenComputeBenchRecord,
  Worker,
  BenchmarkJob,
  CoverageCell,
  PredictionResult,
  FleetResource,
  ProductionDeployment,
  TelemetryWindow,
  OptimizationRecommendation,
  VerifiedSavings,
  InferenceDeploymentState,
  InferenceDeploymentSpec,
  OptimizationAction,
  CanaryRun,
  AutomationPolicy,
  ProductionOutcome,
  AutomationFreeze,
  ControlAuditLog,
} from "@modelforge/benchmark-schema";
import type { HardwareDevice } from "@modelforge/hardware-registry";
import type { ModelFitInput, ModelFitResult } from "@modelforge/model-fit";
import type { OptimizerQuery, OptimizerResult } from "@modelforge/optimizer";

export interface ModelForgeClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

export class ModelForgeError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ModelForgeError";
  }
}

export class ModelForgeClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;

  constructor(options: ModelForgeClientOptions = {}) {
    this.baseUrl = (options.baseUrl || "http://localhost:3000/api/v1").replace(
      /\/$/,
      "",
    );
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs || 15000;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        let errBody: any;
        try {
          errBody = await response.json();
        } catch {
          errBody = await response.text();
        }
        throw new ModelForgeError(
          errBody?.message ||
            `API request failed with status ${response.status}`,
          response.status,
          errBody,
        );
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new ModelForgeError(
          `Request timed out after ${this.timeoutMs}ms`,
          408,
        );
      }
      if (err instanceof ModelForgeError) throw err;
      throw new ModelForgeError(
        err.message || "Unknown network error occurred",
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async listBenchmarks(params?: {
    model?: string;
    hardware?: string;
    runtime?: string;
    precision?: string;
    limit?: number;
  }): Promise<OpenComputeBenchRecord[]> {
    const query = new URLSearchParams();
    if (params?.model) query.set("model", params.model);
    if (params?.hardware) query.set("hardware", params.hardware);
    if (params?.runtime) query.set("runtime", params.runtime);
    if (params?.precision) query.set("precision", params.precision);
    if (params?.limit) query.set("limit", params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request<OpenComputeBenchRecord[]>(`/benchmarks${qs}`);
  }

  async getBenchmark(id: string): Promise<OpenComputeBenchRecord> {
    return this.request<OpenComputeBenchRecord>(`/benchmarks/${id}`);
  }

  async submitBenchmark(record: OpenComputeBenchRecord): Promise<{
    status: "accepted" | "rejected";
    benchmark_id: string;
    verification_status: string;
    url: string;
  }> {
    return this.request(`/benchmark-submissions`, {
      method: "POST",
      body: JSON.stringify(record),
    });
  }

  async computeModelFit(input: ModelFitInput): Promise<ModelFitResult> {
    return this.request<ModelFitResult>(`/model-fit`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async solveOptimizer(query: OptimizerQuery): Promise<OptimizerResult> {
    return this.request<OptimizerResult>(`/optimizer`, {
      method: "POST",
      body: JSON.stringify(query),
    });
  }

  async listHardware(): Promise<HardwareDevice[]> {
    return this.request<HardwareDevice[]>(`/hardware`);
  }

  async getHealth(): Promise<{
    status: string;
    version: string;
    timestamp: string;
    response_time_ms: number;
    services: Record<string, unknown>;
  }> {
    // Health is at /api/health rather than /api/v1/health
    const healthUrl = this.baseUrl.replace(/\/v1$/, "") + "/health";
    const response = await fetch(healthUrl, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new ModelForgeError(
        `Health check failed with status ${response.status}`,
        response.status,
      );
    }
    return response.json();
  }

  async getSupportMatrix(): Promise<unknown> {
    return this.request(`/support-matrix`);
  }

  async listFailures(params?: {
    model?: string;
    category?: string;
    runtime?: string;
  }): Promise<{ total_count: number; failures: unknown[] }> {
    const query = new URLSearchParams();
    if (params?.model) query.set("model", params.model);
    if (params?.category) query.set("category", params.category);
    if (params?.runtime) query.set("runtime", params.runtime);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request(`/failures${qs}`);
  }

  async getComputePassport(
    modelId: string,
    revision = "main",
  ): Promise<unknown> {
    const safeModel = encodeURIComponent(modelId);
    return this.request(
      `/models/${safeModel}/passport?revision=${encodeURIComponent(revision)}`,
    );
  }

  async listModels(family?: string): Promise<unknown[]> {
    const qs = family ? `?family=${encodeURIComponent(family)}` : "";
    return this.request<unknown[]>(`/models${qs}`);
  }

  async getSoftwareLift(
    modelId?: string,
    accelerator?: string,
  ): Promise<unknown[]> {
    const query = new URLSearchParams();
    if (modelId) query.set("model", modelId);
    if (accelerator) query.set("accelerator", accelerator);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request<unknown[]>(`/software-lift${qs}`);
  }

  async compileSlo(spec: {
    model_repository: string;
    model_revision?: string;
    workload: Record<string, unknown>;
    slo: Record<string, unknown>;
  }): Promise<unknown> {
    return this.request(`/slo`, {
      method: "POST",
      body: JSON.stringify(spec),
    });
  }

  // --- PHASE 4 METHODS ---

  async listWorkers(orgId?: string): Promise<Worker[]> {
    const qs = orgId ? `?org_id=${encodeURIComponent(orgId)}` : "";
    return this.request<Worker[]>(`/workers${qs}`);
  }

  async registerWorker(worker: Partial<Worker>): Promise<Worker> {
    return this.request<Worker>(`/workers`, {
      method: "POST",
      body: JSON.stringify(worker),
    });
  }

  async claimJob(
    workerId: string,
    trustTier = "community",
  ): Promise<{ job: BenchmarkJob | null }> {
    return this.request<{ job: BenchmarkJob | null }>(`/jobs/claim`, {
      method: "POST",
      body: JSON.stringify({ worker_id: workerId, trust_tier: trustTier }),
    });
  }

  async completeJob(
    jobId: string,
    resultBenchmark: unknown,
  ): Promise<{ job: BenchmarkJob }> {
    return this.request<{ job: BenchmarkJob }>(`/jobs/${jobId}/complete`, {
      method: "POST",
      body: JSON.stringify({ result_benchmark: resultBenchmark }),
    });
  }

  async listJobs(filters?: {
    status?: string;
    orgId?: string;
  }): Promise<BenchmarkJob[]> {
    const query = new URLSearchParams();
    if (filters?.status) query.set("status", filters.status);
    if (filters?.orgId) query.set("org_id", filters.orgId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request<BenchmarkJob[]>(`/jobs${qs}`);
  }

  async getCoverageMatrix(modelId?: string): Promise<CoverageCell[]> {
    const qs = modelId ? `?model=${encodeURIComponent(modelId)}` : "";
    return this.request<CoverageCell[]>(`/coverage${qs}`);
  }

  async predictPerformance(target: unknown): Promise<PredictionResult> {
    return this.request<PredictionResult>(`/predictions`, {
      method: "POST",
      body: JSON.stringify(target),
    });
  }

  async listFleet(orgId?: string): Promise<FleetResource[]> {
    const qs = orgId ? `?org_id=${encodeURIComponent(orgId)}` : "";
    return this.request<FleetResource[]>(`/fleet${qs}`);
  }

  async optimizeFleet(
    fleet: unknown[],
    workloads: unknown[],
  ): Promise<unknown> {
    return this.request(`/fleet/optimize`, {
      method: "POST",
      body: JSON.stringify({ fleet, workloads }),
    });
  }

  async listDeployments(orgId?: string): Promise<ProductionDeployment[]> {
    const qs = orgId ? `?org_id=${encodeURIComponent(orgId)}` : "";
    return this.request<ProductionDeployment[]>(`/deployments${qs}`);
  }

  async recordTelemetry(data: unknown): Promise<TelemetryWindow> {
    return this.request<TelemetryWindow>(`/telemetry`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listTelemetry(deploymentId: string): Promise<TelemetryWindow[]> {
    return this.request<TelemetryWindow[]>(
      `/telemetry?deployment_id=${encodeURIComponent(deploymentId)}`,
    );
  }

  async listRecommendations(
    orgId?: string,
  ): Promise<OptimizationRecommendation[]> {
    const qs = orgId ? `?org_id=${encodeURIComponent(orgId)}` : "";
    return this.request<OptimizationRecommendation[]>(`/recommendations${qs}`);
  }

  async approveRecommendation(
    id: string,
    approver = "admin",
  ): Promise<OptimizationRecommendation> {
    return this.request<OptimizationRecommendation>(
      `/recommendations/${id}/approve`,
      {
        method: "POST",
        body: JSON.stringify({ approver }),
      },
    );
  }

  async listVerifiedSavings(orgId?: string): Promise<VerifiedSavings[]> {
    const qs = orgId ? `?org_id=${encodeURIComponent(orgId)}` : "";
    return this.request<VerifiedSavings[]>(`/verified-savings${qs}`);
  }

  // --- Phase 5: Autonomous Inference Control Plane Methods ---

  async getControlStatus(orgId = "default"): Promise<{
    status: string;
    mode: string;
    kill_switch_active: boolean;
    active_deployments_count: number;
    pending_actions_count: number;
    canary_in_progress_count: number;
    freezes: AutomationFreeze[];
  }> {
    return this.request(`/control/status?org_id=${encodeURIComponent(orgId)}`);
  }

  async triggerFreeze(params: {
    organization_id: string;
    reason: string;
    scope?: "global" | "project" | "deployment";
    target_id?: string;
    frozen_by?: string;
  }): Promise<AutomationFreeze> {
    return this.request<AutomationFreeze>(`/control/freeze`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async liftFreeze(freezeId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/control/freeze?freeze_id=${encodeURIComponent(freezeId)}`, {
      method: "DELETE",
    });
  }

  async listControlDeployments(orgId?: string): Promise<InferenceDeploymentState[]> {
    const qs = orgId ? `?org_id=${encodeURIComponent(orgId)}` : "";
    return this.request<InferenceDeploymentState[]>(`/control/deployments${qs}`);
  }

  async getControlDeployment(id: string): Promise<InferenceDeploymentState> {
    return this.request<InferenceDeploymentState>(`/control/deployments?id=${encodeURIComponent(id)}`);
  }

  async reconcileDeployment(
    deploymentId: string,
    desiredSpec: InferenceDeploymentSpec,
    executionMode?: string
  ): Promise<OptimizationAction> {
    return this.request<OptimizationAction>(`/control/deployments/${deploymentId}/reconcile`, {
      method: "POST",
      body: JSON.stringify({ desired_spec: desiredSpec, execution_mode: executionMode }),
    });
  }

  async listActions(orgId?: string, deploymentId?: string): Promise<OptimizationAction[]> {
    const params = new URLSearchParams();
    if (orgId) params.append("org_id", orgId);
    if (deploymentId) params.append("deployment_id", deploymentId);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return this.request<OptimizationAction[]>(`/control/actions${qs}`);
  }

  async getAction(actionId: string): Promise<OptimizationAction> {
    return this.request<OptimizationAction>(`/control/actions/${actionId}`);
  }

  async createAction(action: unknown): Promise<OptimizationAction> {
    return this.request<OptimizationAction>(`/control/actions`, {
      method: "POST",
      body: JSON.stringify(action),
    });
  }

  async approveAction(actionId: string, approvedBy = "admin"): Promise<OptimizationAction> {
    return this.request<OptimizationAction>(`/control/actions/${actionId}/approve`, {
      method: "POST",
      body: JSON.stringify({ approved_by: approvedBy }),
    });
  }

  async executeAction(
    actionId: string,
    candidateId?: string,
    telemetry?: unknown
  ): Promise<{ action: OptimizationAction; canary_run?: CanaryRun; outcome?: ProductionOutcome }> {
    return this.request(`/control/actions/${actionId}/execute`, {
      method: "POST",
      body: JSON.stringify({ candidate_id: candidateId, telemetry }),
    });
  }

  async rollbackAction(
    actionId: string,
    reason: string,
    candidateId?: string
  ): Promise<{ action: OptimizationAction; success: boolean }> {
    return this.request(`/control/actions/${actionId}/rollback`, {
      method: "POST",
      body: JSON.stringify({ reason, candidate_id: candidateId }),
    });
  }

  async getPolicy(orgId: string): Promise<AutomationPolicy> {
    return this.request<AutomationPolicy>(`/control/policies?org_id=${encodeURIComponent(orgId)}`);
  }

  async updatePolicy(policy: unknown): Promise<AutomationPolicy> {
    return this.request<AutomationPolicy>(`/control/policies`, {
      method: "PUT",
      body: JSON.stringify(policy),
    });
  }

  async testPolicy(policy: unknown, action: unknown): Promise<{
    allowed: boolean;
    requires_human_approval: boolean;
    denial_reasons: string[];
    checks: Array<{ name: string; passed: boolean; detail: string }>;
  }> {
    return this.request(`/control/policies/test`, {
      method: "POST",
      body: JSON.stringify({ policy, action }),
    });
  }

  async listOutcomes(orgId?: string): Promise<ProductionOutcome[]> {
    const qs = orgId ? `?org_id=${encodeURIComponent(orgId)}` : "";
    return this.request<ProductionOutcome[]>(`/control/outcomes${qs}`);
  }

  async listControlAuditLogs(orgId?: string, actionId?: string): Promise<ControlAuditLog[]> {
    const params = new URLSearchParams();
    if (orgId) params.append("org_id", orgId);
    if (actionId) params.append("action_id", actionId);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return this.request<ControlAuditLog[]>(`/control/audit-logs${qs}`);
  }
}
