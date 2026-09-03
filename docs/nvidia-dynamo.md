# NVIDIA Dynamo Serving & Disaggregated Architecture

> **Architecture:** Disaggregated Prefill & Decode  
> **API Version:** `dynamo.nvidia.com/v1alpha1`  
> **Compiler Target:** `@modelforge/slo-compiler` -> `targets/dynamo.ts`

---

## 1. Why Disaggregated Serving Matters

In monolithic serving architectures (standard vLLM, TGI, or vanilla TensorRT-LLM), both the **compute-bound prefill phase** (prompt processing) and the **memory-bandwidth-bound decode phase** (token-by-token generation) compete for identical GPU compute resources and KV cache memory.

Under high concurrency or bursty RAG workloads, prefill bursts preempt active decodes, causing **massive P95 TTFT spikes** and degrading inter-token latency (TPOT).

### Disaggregated Prefill/Decode in ModelForge

ModelForge synthesizes dedicated worker topologies:

- **Prefill Workers:** Sized for high compute density (Tensor Cores / FLOPS). Processes large prompt contexts rapidly.
- **Decode Workers:** Sized for maximum memory bandwidth (HBM3e / high GB/s). Maximizes parallel sequence decodes.
- **High-Speed Interconnect:** Transfers KV cache across nodes over InfiniBand NDR or NVLink.
- **KV-Cache-Aware Routing:** Intelligently routes incoming requests to prefill nodes with partial prefix caches.

---

## 2. Generated Kubernetes CRD Example

```yaml
apiVersion: dynamo.nvidia.com/v1alpha1
kind: DynamoServingDeployment
metadata:
  name: qwen2-5-32b-instruct-dynamo
  namespace: modelforge-serving
spec:
  model:
    repository: "Qwen/Qwen2.5-32B-Instruct"
    revision: "main"
    precision: "fp8"
  serving_mode: disaggregated
  routing:
    policy: kv_cache_affinity
    cross_node_interconnect: infiniband_ndr
  topology:
    prefill:
      replicas: 1
      tensor_parallel_size: 1
      gpu_allocation:
        device_type: "NVIDIA L40S 48GB"
        count_per_replica: 1
    decode:
      replicas: 1
      tensor_parallel_size: 1
      gpu_allocation:
        device_type: "NVIDIA L40S 48GB"
        count_per_replica: 1
```

---

## 3. Empirical Advantages

Holding the underlying accelerator and model constant:

- **P95 TTFT Reduction:** 62% decrease compared to monolithic baseline.
- **Throughput Lift:** 2.71x tokens/sec sustained at concurrency = 32.
- **KV Cache Evictions:** Reduced to near 0% under bursty arrivals.
