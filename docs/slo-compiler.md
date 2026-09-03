# ModelForge Inference SLO Compiler

> **Package:** `@modelforge/slo-compiler`  
> **Version:** 2.0.0  
> **API Route:** `POST /api/v1/plans` & `POST /api/v1/slo/compile`

---

## 1. Overview

Deploying open-source LLMs typically requires trial and error: engineering teams guess at tensor parallelism, fail with out-of-memory errors on long context, or dramatically over-provision multi-GPU nodes.

The **ModelForge Inference SLO Compiler** treats deployment as a constraint satisfaction and optimization problem:

$$\min_{\text{topology} \in \mathcal{T}} \text{Cost}(\text{topology}) \quad \text{s.t.} \quad \text{TTFT}_{P95} \le \tau_{\text{prefill}}, \quad \text{TPOT}_{P95} \le \tau_{\text{decode}}, \quad \text{Memory} \le \text{VRAM}_{\text{avail}}$$

---

## 2. Input Specifications

### Workload Fingerprint (`WorkloadFingerprint`)
A privacy-preserving representation of the serving workload:
- `task_type`: `'rag' | 'code_completion' | 'conversational' | 'reasoning' | 'summarization' | 'embedding' | 'custom'`
- `prompt_token_mean`: Average input prompt length in tokens.
- `output_token_mean`: Average generated sequence length in tokens.
- `context_length_target`: P95 context window ceiling.
- `target_concurrency`: Expected concurrent active client requests.
- `requests_per_day`: Daily volume for cost modeling.
- `streaming_required`: Boolean.
- `arrival_pattern`: `'steady' | 'bursty' | 'poisson' | 'diurnal'`.

### Service Level Objective (`SLOSpec`)
- `p95_ttft_ms`: Maximum acceptable Time-to-First-Token in milliseconds.
- `target_tpot_ms`: Maximum acceptable Time-per-Output-Token (inter-token latency).
- `max_cost_per_million_tokens_usd`: Maximum allowable blended token cost.
- `optimize_for`: `'cost' | 'latency' | 'throughput' | 'balanced' | 'energy'`.

---

## 3. Supported Deployment Targets

The compiler evaluates and synthesizes configurations across:

1. **NVIDIA Dynamo** (`apiVersion: dynamo.nvidia.com/v1alpha1`):
   - Disaggregated prefill and decode execution.
   - KV-cache-aware routing policy (`kv_cache_affinity`).
   - Independent GPU scaling for compute-bound prefill vs memory-bandwidth-bound decode.

2. **NVIDIA NIM** (`nvcr.io/nim/...`):
   - Turnkey container composition with pre-compiled TensorRT-LLM engines.
   - Built-in OpenAI-compatible API and health probes.

3. **vLLM** (`vllm/vllm-openai`):
   - Continuous batching, PagedAttention, and multi-GPU tensor parallelism.
   - Kubernetes Pod and Docker Run manifest generators.

4. **SGLang & llama.cpp**:
   - Optimized prefix caching and consumer edge/quantized targets.

---

## 4. CLI Usage

```bash
# Compile a workload spec into ranked candidates
modelforge plan workload.yaml

# Generate deployable infrastructure manifests for NVIDIA Dynamo
modelforge deploy-plan workload.yaml --target dynamo --out-dir ./modelforge-plan
```
