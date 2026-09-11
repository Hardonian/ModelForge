export interface ShadowReplayConfig {
  traffic_sample_pct: number;
  suppress_external_mutations: boolean;
  suppress_email_and_notifications: boolean;
  suppress_database_writes: boolean;
  suppress_payments: boolean;
  max_shadow_duration_minutes: number;
}

export interface ShadowEvaluationResult {
  passed: boolean;
  shadow_requests_sent: number;
  error_count: number;
  mean_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms?: number;
  side_effects_suppressed_count: number;
  warnings: string[];
}

export interface ShadowRequestPayload {
  requestId: string;
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  timestamp?: number;
}

export interface ShadowReplayResponse {
  statusCode: number;
  latencyMs: number;
  error?: string;
  body?: unknown;
}

export interface ShadowClient {
  send(candidateEndpoint: string, request: ShadowRequestPayload): Promise<ShadowReplayResponse>;
}

export class DefaultShadowClient implements ShadowClient {
  private timeoutMs: number;

  constructor(timeoutMs: number = 3000) {
    this.timeoutMs = timeoutMs;
  }

  async send(candidateEndpoint: string, request: ShadowRequestPayload): Promise<ShadowReplayResponse> {
    const startTime = performance.now();
    try {
      const url = `${candidateEndpoint.replace(/\/$/, "")}${request.path.startsWith("/") ? "" : "/"}${request.path}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, {
        method: request.method,
        headers: {
          ...request.headers,
          "x-modelforge-shadow-mode": "true",
          "x-modelforge-parent-request-id": request.requestId,
        },
        body: request.body && request.method !== "GET" && request.method !== "HEAD"
          ? (typeof request.body === "string" ? request.body : JSON.stringify(request.body))
          : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        statusCode: response.status,
        latencyMs,
      };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - startTime);
      const message = err instanceof Error ? err.message : String(err);
      return {
        statusCode: 504,
        latencyMs,
        error: message,
      };
    }
  }
}

export class ShadowTrafficEngine {
  private static readonly MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
  private static readonly PAYMENT_PATH_KEYWORDS = ["/charge", "/pay", "stripe", "/checkout", "/billing", "/subscription"];
  private static readonly NOTIFICATION_PATH_KEYWORDS = ["/notify", "/email", "/sms", "/alert", "/webhook", "/push"];
  private static readonly DB_WRITE_PATH_KEYWORDS = ["/insert", "/update", "/delete", "/upsert", "/mutation", "/write"];

  static evaluateShadowSafety(config: ShadowReplayConfig): { safe: boolean; reason?: string } {
    if (!config.suppress_external_mutations) {
      return {
        safe: false,
        reason: "Shadow traffic MUST suppress external API mutations to prevent duplicate side-effects",
      };
    }
    if (!config.suppress_database_writes) {
      return {
        safe: false,
        reason: "Shadow traffic MUST suppress persistent database writes",
      };
    }
    if (!config.suppress_payments) {
      return {
        safe: false,
        reason: "Shadow traffic MUST suppress payments and financial transactions",
      };
    }
    return { safe: true };
  }

  static simulateShadowEvaluation(
    candidateHealthy: boolean,
    targetP95LatencyMs: number
  ): ShadowEvaluationResult {
    if (!candidateHealthy) {
      return {
        passed: false,
        shadow_requests_sent: 50,
        error_count: 50,
        mean_latency_ms: 0,
        p95_latency_ms: 0,
        side_effects_suppressed_count: 50,
        warnings: ["Candidate failed initial shadow connectivity test"],
      };
    }

    return {
      passed: true,
      shadow_requests_sent: 500,
      error_count: 0,
      mean_latency_ms: Math.round(targetP95LatencyMs * 0.7),
      p95_latency_ms: targetP95LatencyMs,
      side_effects_suppressed_count: 142,
      warnings: [],
    };
  }

  static isMutationSafe(
    request: ShadowRequestPayload,
    config: ShadowReplayConfig
  ): { safeToMirror: boolean; suppressedSideEffect: boolean; reason?: string } {
    const method = request.method.toUpperCase();
    const isMutating = this.MUTATING_METHODS.has(method);

    if (!isMutating) {
      return { safeToMirror: true, suppressedSideEffect: false };
    }

    const pathLower = request.path.toLowerCase();
    const bodyStr = request.body ? JSON.stringify(request.body).toLowerCase() : "";

    // Payment suppression
    if (config.suppress_payments) {
      const isPayment = this.PAYMENT_PATH_KEYWORDS.some(k => pathLower.includes(k) || bodyStr.includes(k));
      if (isPayment) {
        return {
          safeToMirror: false,
          suppressedSideEffect: true,
          reason: "Payment mutation suppressed from shadow replay to prevent duplicate transactions",
        };
      }
    }

    // Notification suppression
    if (config.suppress_email_and_notifications) {
      const isNotification = this.NOTIFICATION_PATH_KEYWORDS.some(k => pathLower.includes(k) || bodyStr.includes(k));
      if (isNotification) {
        return {
          safeToMirror: false,
          suppressedSideEffect: true,
          reason: "Notification or webhook side-effect suppressed from shadow replay",
        };
      }
    }

    // Database write suppression
    if (config.suppress_database_writes) {
      const isDbWrite = this.DB_WRITE_PATH_KEYWORDS.some(k => pathLower.includes(k));
      if (isDbWrite) {
        return {
          safeToMirror: false,
          suppressedSideEffect: true,
          reason: "Persistent database mutation suppressed from shadow replay",
        };
      }
    }

    // External mutations in general
    if (config.suppress_external_mutations) {
      return {
        safeToMirror: false,
        suppressedSideEffect: true,
        reason: "Mutating request suppressed under strict external mutation policy",
      };
    }

    return { safeToMirror: true, suppressedSideEffect: false };
  }

  static sanitizeShadowRequest(
    request: ShadowRequestPayload,
    _config: ShadowReplayConfig
  ): ShadowRequestPayload {
    const sanitizedHeaders: Record<string, string> = { ...(request.headers ?? {}) };
    
    // Strip sensitive authentication tokens from candidate mirrors
    delete sanitizedHeaders["authorization"];
    delete sanitizedHeaders["cookie"];
    delete sanitizedHeaders["x-api-key"];

    sanitizedHeaders["x-modelforge-shadow-mode"] = "true";
    sanitizedHeaders["x-modelforge-parent-request-id"] = request.requestId;
    sanitizedHeaders["x-modelforge-shadow-timestamp"] = String(Date.now());

    return {
      ...request,
      headers: sanitizedHeaders,
    };
  }

  static calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    const clampedIndex = Math.max(0, Math.min(index, sortedValues.length - 1));
    return sortedValues[clampedIndex] ?? 0;
  }

  static async replayBatch(
    candidateEndpoint: string,
    requests: ShadowRequestPayload[],
    config: ShadowReplayConfig,
    client?: ShadowClient
  ): Promise<ShadowEvaluationResult> {
    const shadowClient = client ?? new DefaultShadowClient();
    const safetyCheck = this.evaluateShadowSafety(config);
    if (!safetyCheck.safe) {
      return {
        passed: false,
        shadow_requests_sent: 0,
        error_count: 0,
        mean_latency_ms: 0,
        p95_latency_ms: 0,
        side_effects_suppressed_count: 0,
        warnings: [`Shadow configuration unsafe: ${safetyCheck.reason}`],
      };
    }

    const latencies: number[] = [];
    let errorCount = 0;
    let suppressedCount = 0;
    let sentCount = 0;
    const warnings: string[] = [];

    for (const req of requests) {
      // Check traffic sampling rate
      const roll = Math.random() * 100;
      if (roll > config.traffic_sample_pct) {
        continue;
      }

      // Check side-effect safety
      const sideEffectCheck = this.isMutationSafe(req, config);
      if (!sideEffectCheck.safeToMirror) {
        if (sideEffectCheck.suppressedSideEffect) {
          suppressedCount++;
        }
        continue;
      }

      // Sanitize and dispatch
      const sanitizedReq = this.sanitizeShadowRequest(req, config);
      sentCount++;

      const res = await shadowClient.send(candidateEndpoint, sanitizedReq);
      latencies.push(res.latencyMs);

      if (res.statusCode >= 500 || res.error) {
        errorCount++;
      }
    }

    if (sentCount === 0) {
      return {
        passed: true,
        shadow_requests_sent: 0,
        error_count: 0,
        mean_latency_ms: 0,
        p95_latency_ms: 0,
        side_effects_suppressed_count: suppressedCount,
        warnings: ["No requests matched sampling criteria or all were safely suppressed"],
      };
    }

    latencies.sort((a, b) => a - b);
    const sumLatency = latencies.reduce((acc, l) => acc + l, 0);
    const meanLatencyMs = Math.round(sumLatency / latencies.length);
    const p95LatencyMs = this.calculatePercentile(latencies, 95);
    const p99LatencyMs = this.calculatePercentile(latencies, 99);

    const errorRate = errorCount / sentCount;
    const passed = errorRate <= 0.01;

    if (errorRate > 0.01) {
      warnings.push(`Candidate error rate of ${(errorRate * 100).toFixed(2)}% exceeded the 1.0% allowable shadow limit`);
    }

    return {
      passed,
      shadow_requests_sent: sentCount,
      error_count: errorCount,
      mean_latency_ms: meanLatencyMs,
      p95_latency_ms: p95LatencyMs,
      p99_latency_ms: p99LatencyMs,
      side_effects_suppressed_count: suppressedCount,
      warnings,
    };
  }
}

