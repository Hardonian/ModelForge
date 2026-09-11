import { SmartRouter } from "@modelforge/reconciler";
import { SmartRouterBackend } from "@modelforge/benchmark-schema";

const defaultBackends: SmartRouterBackend[] = [
  {
    id: "worker-node-us-east-h100-01",
    url: "http://h100-01.internal:8000",
    model: "meta-llama/Llama-3-70B",
    status: "active",
    active_requests: 1,
    capacity: 32,
    warm_prefix_hashes: ["default-system-prompt"],
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "worker-node-us-east-h100-02",
    url: "http://h100-02.internal:8000",
    model: "meta-llama/Llama-3-70B",
    status: "active",
    active_requests: 0,
    capacity: 32,
    warm_prefix_hashes: [],
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: "worker-node-us-central-tpu-v6e-01",
    url: "http://tpu-01.internal:8000",
    model: "google/gemma-2-27b",
    status: "active",
    active_requests: 0,
    capacity: 64,
    warm_prefix_hashes: [],
    last_heartbeat: new Date().toISOString(),
  },
];

export const smartRouterInstance = new SmartRouter(defaultBackends);
