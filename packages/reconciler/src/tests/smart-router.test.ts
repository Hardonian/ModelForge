import test from "node:test";
import assert from "node:assert/strict";
import { SmartRouter } from "../smart-router";
import { SmartRouterBackend } from "@modelforge/benchmark-schema";

const backend1: SmartRouterBackend = {
  id: "worker-h100-us-east-1",
  url: "http://worker-1.internal:8000",
  model: "meta-llama/Llama-3-70B",
  status: "active",
  active_requests: 0,
  capacity: 32,
  warm_prefix_hashes: [],
  last_heartbeat: new Date().toISOString(),
};

const backend2: SmartRouterBackend = {
  id: "worker-h100-us-east-2",
  url: "http://worker-2.internal:8000",
  model: "meta-llama/Llama-3-70B",
  status: "active",
  active_requests: 5,
  capacity: 32,
  warm_prefix_hashes: [],
  last_heartbeat: new Date().toISOString(),
};

test("SmartRouter - Sub-millisecond dispatch and least-connection routing", () => {
  const router = new SmartRouter([backend1, backend2]);
  const res = router.route(
    "You are a coding assistant. Write a quicksort in Rust.",
    "meta-llama/Llama-3-70B",
  );

  // Router overhead must be sub-millisecond (< 1.0 ms)
  assert.ok(
    res.route.routing_overhead_ms < 1.0,
    `Overhead was ${res.route.routing_overhead_ms}ms, expected < 1.0ms`,
  );
  // Should select backend1 because it has 0 active requests vs 5
  assert.equal(res.route.selected_worker_id, "worker-h100-us-east-1");
  assert.equal(res.route.cache_hit, false);
});

test("SmartRouter - Prefix-cache affinity hit", () => {
  const router = new SmartRouter([backend1, backend2]);
  const systemPrompt = "System: You are an enterprise code reviewer specialized in security.";

  // First request: establishes prefix affinity on chosen worker
  const res1 = router.route(
    `${systemPrompt} Review this auth handler: function auth() {}`,
    "meta-llama/Llama-3-70B",
  );

  // Second request: shares identical system prompt prefix
  const res2 = router.route(
    `${systemPrompt} Review this SQL query: SELECT * FROM users`,
    "meta-llama/Llama-3-70B",
  );

  assert.equal(res2.route.cache_hit, true);
  assert.equal(res2.route.selected_worker_id, res1.route.selected_worker_id);
});

test("SmartRouter - Spot-drain migration upon preemption notice", () => {
  const router = new SmartRouter([backend1, backend2]);

  // Route a request to backend1
  router.route("Initial workload prompt", "meta-llama/Llama-3-70B");
  assert.ok(router.getBackend("worker-h100-us-east-1")!.active_requests > 0);

  // Spot preemption event arrives
  const drainReport = router.drainWorker("worker-h100-us-east-1", "spot_preemption_event");

  assert.equal(drainReport.status, "draining");
  assert.equal(router.getBackend("worker-h100-us-east-1")!.status, "draining");
  assert.equal(router.getBackend("worker-h100-us-east-1")!.active_requests, 0);
  assert.ok(drainReport.migrated_count > 0);

  // Subsequent request must NOT be routed to draining worker
  const res = router.route("Next user prompt", "meta-llama/Llama-3-70B");
  assert.notEqual(res.route.selected_worker_id, "worker-h100-us-east-1");
  assert.equal(res.route.selected_worker_id, "worker-h100-us-east-2");
});
