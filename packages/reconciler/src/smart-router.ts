import * as crypto from "crypto";
import {
  SmartRouterBackend,
  SmartRouterRouteSpec,
} from "@modelforge/benchmark-schema";

export interface RouteResult {
  route: SmartRouterRouteSpec;
  backend: SmartRouterBackend;
}

export class SmartRouter {
  private readonly backends: Map<string, SmartRouterBackend> = new Map();
  // Prefix hash to Set of backend IDs that hold the warm KV-cache
  private readonly prefixCacheMap: Map<string, Set<string>> = new Map();

  constructor(initialBackends: SmartRouterBackend[] = []) {
    for (const b of initialBackends) {
      this.registerBackend(b);
    }
  }

  public registerBackend(backend: SmartRouterBackend): void {
    this.backends.set(backend.id, { ...backend });
    for (const hash of backend.warm_prefix_hashes || []) {
      this.addPrefixAffinity(hash, backend.id);
    }
  }

  public getBackend(id: string): SmartRouterBackend | undefined {
    return this.backends.get(id);
  }

  public listBackends(): SmartRouterBackend[] {
    return Array.from(this.backends.values());
  }

  public updateHeartbeat(id: string): void {
    const b = this.backends.get(id);
    if (b) {
      b.last_heartbeat = new Date().toISOString();
    }
  }

  /**
   * Fast-path routing algorithm (<1ms) featuring:
   * 1. Prefix-cache affinity to reuse warm GPU KV-cache.
   * 2. Least-connection balancing among non-draining backends.
   */
  public route(
    prompt: string,
    model: string,
  ): RouteResult {
    const startNs = process.hrtime.bigint();
    const requestId = `req-${crypto.randomUUID().slice(0, 8)}`;

    // Generate deterministic prompt prefix hash (first 64 characters / chunk block)
    const prefixSegment = prompt.trim().slice(0, 64);
    const prefixHash = crypto
      .createHash("sha256")
      .update(prefixSegment)
      .digest("hex")
      .slice(0, 16);

    // 1. Check prefix affinity for warm KV cache
    const affinityCandidates = this.prefixCacheMap.get(prefixHash);
    let selectedBackend: SmartRouterBackend | null = null;
    let cacheHit = false;

    if (affinityCandidates && affinityCandidates.size > 0) {
      for (const candidateId of affinityCandidates) {
        const b = this.backends.get(candidateId);
        if (
          b &&
          b.status === "active" &&
          b.model === model &&
          b.active_requests < b.capacity
        ) {
          selectedBackend = b;
          cacheHit = true;
          break;
        }
      }
    }

    // 2. Fallback to least-connection active backend
    if (!selectedBackend) {
      const activeBackends = Array.from(this.backends.values()).filter(
        (b) => b.status === "active" && b.model === model,
      );

      if (activeBackends.length === 0) {
        throw new Error(
          `No active healthy inference backend available for model ${model}`,
        );
      }

      // Sort by active requests ascending
      activeBackends.sort((a, b) => a.active_requests - b.active_requests);
      selectedBackend = activeBackends[0]!;
    }

    // Update state: increment active requests and bind prefix
    selectedBackend.active_requests += 1;
    this.addPrefixAffinity(prefixHash, selectedBackend.id);

    const endNs = process.hrtime.bigint();
    const overheadMs = Number(endNs - startNs) / 1_000_000.0;

    const routeSpec: SmartRouterRouteSpec = {
      request_id: requestId,
      selected_worker_id: selectedBackend.id,
      cache_hit: cacheHit,
      prefix_hash: prefixHash,
      routing_overhead_ms: Math.round(overheadMs * 1000) / 1000,
      spot_drain_migrated: false,
    };

    return { route: routeSpec, backend: selectedBackend };
  }

  /**
   * Initiates graceful spot instance drain upon preemption notice.
   * Immediately stops new request routing and migrates active workload safely.
   */
  public drainWorker(
    workerId: string,
    reason = "spot_instance_preemption",
  ): {
    worker_id: string;
    status: string;
    reason: string;
    active_requests_remaining: number;
    migrated_count: number;
  } {
    const worker = this.backends.get(workerId);
    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }

    worker.status = "draining";

    // Remove worker from prefix cache routing affinity
    for (const [hash, workers] of this.prefixCacheMap.entries()) {
      workers.delete(workerId);
      if (workers.size === 0) {
        this.prefixCacheMap.delete(hash);
      }
    }

    // Migrate any active requests to alternative active workers
    let migratedCount = 0;
    if (worker.active_requests > 0) {
      const activeAlternative = Array.from(this.backends.values()).find(
        (b) => b.id !== workerId && b.status === "active" && b.model === worker.model,
      );

      if (activeAlternative) {
        activeAlternative.active_requests += worker.active_requests;
        migratedCount = worker.active_requests;
        worker.active_requests = 0;
      }
    }

    return {
      worker_id: workerId,
      status: "draining",
      reason,
      active_requests_remaining: worker.active_requests,
      migrated_count: migratedCount,
    };
  }

  public completeRequest(workerId: string): void {
    const b = this.backends.get(workerId);
    if (b && b.active_requests > 0) {
      b.active_requests -= 1;
    }
  }

  private addPrefixAffinity(prefixHash: string, workerId: string): void {
    if (!this.prefixCacheMap.has(prefixHash)) {
      this.prefixCacheMap.set(prefixHash, new Set());
    }
    this.prefixCacheMap.get(prefixHash)!.add(workerId);

    const b = this.backends.get(workerId);
    if (b && !b.warm_prefix_hashes.includes(prefixHash)) {
      b.warm_prefix_hashes.push(prefixHash);
    }
  }
}
