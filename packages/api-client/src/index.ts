import type { OpenComputeBenchRecord } from '@modelforge/benchmark-schema';
import type { HardwareDevice } from '@modelforge/hardware-registry';
import type { ModelFitInput, ModelFitResult } from '@modelforge/model-fit';
import type { OptimizerQuery, OptimizerResult } from '@modelforge/optimizer';

export interface ModelForgeClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

export class ModelForgeError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ModelForgeError';
  }
}

export class ModelForgeClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;

  constructor(options: ModelForgeClientOptions = {}) {
    this.baseUrl = (options.baseUrl || 'http://localhost:3000/api/v1').replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs || 15000;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      if (!response.ok) {
        let errBody: any;
        try {
          errBody = await response.json();
        } catch {
          errBody = await response.text();
        }
        throw new ModelForgeError(
          errBody?.message || `API request failed with status ${response.status}`,
          response.status,
          errBody
        );
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new ModelForgeError(`Request timed out after ${this.timeoutMs}ms`, 408);
      }
      if (err instanceof ModelForgeError) throw err;
      throw new ModelForgeError(err.message || 'Unknown network error occurred');
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
    if (params?.model) query.set('model', params.model);
    if (params?.hardware) query.set('hardware', params.hardware);
    if (params?.runtime) query.set('runtime', params.runtime);
    if (params?.precision) query.set('precision', params.precision);
    if (params?.limit) query.set('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<OpenComputeBenchRecord[]>(`/benchmarks${qs}`);
  }

  async getBenchmark(id: string): Promise<OpenComputeBenchRecord> {
    return this.request<OpenComputeBenchRecord>(`/benchmarks/${id}`);
  }

  async submitBenchmark(record: OpenComputeBenchRecord): Promise<{
    status: 'accepted' | 'rejected';
    benchmark_id: string;
    verification_status: string;
    url: string;
  }> {
    return this.request(`/benchmark-submissions`, {
      method: 'POST',
      body: JSON.stringify(record)
    });
  }

  async computeModelFit(input: ModelFitInput): Promise<ModelFitResult> {
    return this.request<ModelFitResult>(`/model-fit`, {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  async solveOptimizer(query: OptimizerQuery): Promise<OptimizerResult> {
    return this.request<OptimizerResult>(`/optimizer`, {
      method: 'POST',
      body: JSON.stringify(query)
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
    const healthUrl = this.baseUrl.replace(/\/v1$/, '') + '/health';
    const response = await fetch(healthUrl, {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) {
      throw new ModelForgeError(`Health check failed with status ${response.status}`, response.status);
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
    if (params?.model) query.set('model', params.model);
    if (params?.category) query.set('category', params.category);
    if (params?.runtime) query.set('runtime', params.runtime);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/failures${qs}`);
  }

  async getComputePassport(modelId: string, revision = 'main'): Promise<unknown> {
    const safeModel = encodeURIComponent(modelId);
    return this.request(`/models/${safeModel}/passport?revision=${encodeURIComponent(revision)}`);
  }

  async listModels(family?: string): Promise<unknown[]> {
    const qs = family ? `?family=${encodeURIComponent(family)}` : '';
    return this.request<unknown[]>(`/models${qs}`);
  }

  async getSoftwareLift(modelId?: string, accelerator?: string): Promise<unknown[]> {
    const query = new URLSearchParams();
    if (modelId) query.set('model', modelId);
    if (accelerator) query.set('accelerator', accelerator);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<unknown[]>(`/software-lift${qs}`);
  }

  async compileSlo(spec: {
    model_repository: string;
    model_revision?: string;
    workload: Record<string, unknown>;
    slo: Record<string, unknown>;
  }): Promise<unknown> {
    return this.request(`/slo`, {
      method: 'POST',
      body: JSON.stringify(spec)
    });
  }
}

