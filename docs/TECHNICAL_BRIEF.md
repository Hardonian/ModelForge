# ModelForge Technical Architecture Brief

**System Architecture, Cryptographic Verification, and Mathematical Optimization Specification**

---

## 1. System Architecture Overview

ModelForge operates as a multi-tier deployment intelligence platform comprising:
1. **Schema & Verification Engine (`@modelforge/benchmark-schema`)**: Zod runtime validation, canonical cryptographic hash generators, and Deterministic Confidence Engine v1.0.0.
2. **Hardware Registry (`@modelforge/hardware-registry`)**: Normalized accelerator telemetry and manufacturer baseline catalog.
3. **Inference SLO Compiler (`@modelforge/slo-compiler`)**: Workload compiler sizing weight memory, KV cache allocation, concurrency scaling, and ranking deployment topologies.
4. **Optimization Solver (`@modelforge/optimizer`)**: Multi-objective Pareto frontier solver balancing cost per million tokens against P95 TTFT latency.
5. **Model Context Protocol Server (`modelforge mcp`)**: JSON-RPC 2.0 stdio server providing AI coding agents with 9 inspection and synthesis tools.
6. **Data Layer (`@modelforge/database`)**: Dual-engine storage utilizing Supabase PostgreSQL with Row-Level Security (RLS) and in-memory test fallback.

---

## 2. Deterministic Confidence Engine v1.0.0

Confidence scoring on ModelForge is strictly algorithmic and deterministic. It never relies on LLM heuristics.

### Confidence Formula (0 - 100 Points)

$$\text{Confidence} = S_{\text{rev}} + S_{\text{runtime}} + S_{\text{hw}} + S_{\text{samples}} + S_{\text{repro}} + S_{\text{fresh}} + S_{\text{var}}$$

Where:
- **Exact Revision Match ($S_{\text{rev}}$)**: 25 points if the benchmark exactly matches the target commit SHA; 10 points if branch match (`main`).
- **Runtime Match ($S_{\text{runtime}}$)**: 20 points if verified on target runtime engine; 10 points for compatible runtime.
- **Hardware Family Match ($S_{\text{hw}}$)**: 20 points for exact accelerator match; 10 points for identical architecture.
- **Sample Volume ($S_{\text{samples}}$)**: Up to 10 points based on inference request iteration counts ($\ge 50$ samples = 10 pts).
- **Independent Reproductions ($S_{\text{repro}}$)**: Up to 15 points ($\ge 3$ reproductions = 15 pts).
- **Benchmark Freshness ($S_{\text{fresh}}$)**: 5 points if tested within 60 days; 2 points within 180 days.
- **Measured Variance ($S_{\text{var}}$)**: 5 points if throughput variance across runs is $\le 3\%$.

---

## 3. Cryptographic Hashes & Tamper Prevention

Every benchmark record generates two SHA-256 digests:

### Environment Hash (`environment_hash`)
Computes digest over normalized hardware specifications, operating system, display driver version, CUDA/ROCm runtime version, and serving engine arguments:
$$\text{environment\_hash} = \text{SHA256}(\text{SortKeys}(\text{Hardware} \parallel \text{Software} \parallel \text{Runtime}))$$

### Result Hash (`result_hash`)
Computes digest over workload distributions and measured output metrics:
$$\text{result\_hash} = \text{SHA256}(\text{SortKeys}(\text{Model} \parallel \text{Precision} \parallel \text{Workload} \parallel \text{Metrics}))$$

If a benchmark record is altered post-execution, validation fails immediately.

---

## 4. Workload Memory Modeling & Sizing

The SLO Compiler computes total accelerator VRAM requirements as:

$$\text{VRAM}_{\text{total}} = \text{Memory}_{\text{weights}} + \text{Memory}_{\text{kv\_cache}} + \text{Memory}_{\text{runtime\_overhead}}$$

Where:
$$\text{Memory}_{\text{weights}} = \text{Parameters}_{\text{billions}} \times \text{BytesPerParam}$$
- FP16/BF16: 2.0 bytes/param
- FP8: 1.0 byte/param
- INT4: 0.55 bytes/param

$$\text{Memory}_{\text{kv\_cache}} = \frac{2 \times L \times H_{\text{kv}} \times D_{\text{head}} \times C_{\text{len}} \times B_{\text{elem}} \times N_{\text{concurrency}}}{10^9}$$

If $\text{VRAM}_{\text{total}} > \text{VRAM}_{\text{accelerator}} \times 0.90$, tensor parallelism is scaled across $N$ GPUs:
$$N_{\text{gpus}} = \left\lceil \frac{\text{VRAM}_{\text{total}}}{\text{VRAM}_{\text{accelerator}} \times 0.90} \right\rceil$$

If $N_{\text{gpus}} > 8$, the configuration is cataloged as `OUT_OF_MEMORY` in the Failure Corpus.
