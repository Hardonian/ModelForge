# ModelForge Compute Passport Specification

> **Schema Version:** 2.0.0  
> **Package:** `@modelforge/benchmark-schema`  
> **API Route:** `/api/v1/models/{org}/{model}/passport?rev={revision}`

---

## 1. Motivation

In the open-source LLM ecosystem, a repository identifier like `Qwen/Qwen2.5-32B-Instruct` is **not static**. Model maintainers continuously push updated checkpoint commits, convert tokenizer configurations, add quantized branches, or modify chat templates.

Furthermore, serving teams routinely run into unverified runtime claims:
- *"Does this model support vLLM continuous batching?"*
- *"Does it run in FP8 on Ada L40S?"*
- *"Can I deploy this on NVIDIA Dynamo with disaggregated prefill/decode?"*
- *"Will this run within 24GB VRAM?"*

A **Compute Passport** is a cryptographically verifiable, revision-specific deployment specification that certifies exact model identity, empirical execution compatibility across runtimes, memory profiles across precisions, and benchmark evidence coverage.

---

## 2. Canonical Identity

Every Compute Passport is strictly anchored to:
```
{organization}/{model_name}@{revision}
```

Example:
`Qwen/Qwen2.5-32B-Instruct@main` or `deepseek-ai/DeepSeek-R1-Distill-Qwen-32B@1e42f9b...`

Treating `org/model` as sufficient without revision tracking is explicitly prohibited by ModelForge schema integrity rules.

---

## 3. Evidence Provenance Tiers

Every compatibility claim and performance metric in a Compute Passport declares its provenance:

| Provenance Level | Description | Trust Weight |
|---|---|---|
| **`MEASURED`** | Multi-run empirical telemetry executed on real physical accelerators by verified OpenComputeBench workers. | **1.00** |
| **`DOCUMENTED`** | Official vendor support statements, framework release notes, or tested architectural PRs. | **0.85** |
| **`DERIVED`** | Analytically calculated using GPU memory models, tensor parallelism rules, and roofline formulas. | **0.70** |
| **`PREDICTED`** | Machine-learning regression estimated from adjacent parameter architectures. | **0.50** |
| **`UNKNOWN`** | Untested runtime or accelerator configuration. | **0.00** |

---

## 4. Compute Passport JSON Schema

```json
{
  "passport_id": "10000000-0000-0000-0000-000000000001",
  "schema_version": "2.0.0",
  "model_id": "Qwen/Qwen2.5-32B-Instruct",
  "revision": "main",
  "hf_url": "https://huggingface.co/Qwen/Qwen2.5-32B-Instruct",
  "architecture": "Qwen2ForCausalLM",
  "parameters_billions": 32.5,
  "context_window": 131072,
  "license": "Apache-2.0",
  "gated": false,
  "compatibility": {
    "vllm": { "status": "supported", "provenance": "MEASURED", "notes": "Verified v0.6.4" },
    "nvidia-nim": { "status": "supported", "provenance": "DOCUMENTED" },
    "nvidia-dynamo": { "status": "supported", "provenance": "MEASURED" },
    "tensorrt-llm": { "status": "supported", "provenance": "MEASURED" },
    "sglang": { "status": "supported", "provenance": "DOCUMENTED" },
    "llama.cpp": { "status": "supported", "provenance": "MEASURED" },
    "hf-jobs": { "status": "supported", "provenance": "DOCUMENTED" },
    "hf-zerogpu": { "status": "experimental", "provenance": "DERIVED" }
  },
  "memory_profile": {
    "weights_fp16_gb": 65.0,
    "weights_fp8_gb": 32.5,
    "weights_int4_gb": 17.8,
    "min_vram_gb": 24.0,
    "recommended_vram_gb": 48.0
  },
  "coverage": {
    "accelerators_tested": ["NVIDIA L40S 48GB", "NVIDIA H100 SXM5 80GB", "RTX 4090 24GB"],
    "runtimes_tested": ["vllm", "tensorrt-llm", "dynamo"],
    "total_benchmarks": 18,
    "total_reproductions": 8,
    "freshness_status": "CURRENT"
  },
  "confidence": {
    "score": 96,
    "explanation": "Backed by 18 independent multi-run benchmarks with 8 verified reproductions."
  }
}
```

---

## 5. Hugging Face Model Card Embeddings

You can embed dynamic ModelForge badges directly into your Hugging Face `README.md`:

```markdown
[![ModelForge Compute Passport](https://img.shields.io/badge/Compute%20Passport-Verified-blue)](https://modelforge.dev/models/Qwen/Qwen2.5-32B-Instruct/passport)
[![ModelFit Score](https://img.shields.io/badge/ModelFit-96%2F100%20(A%2B)-brightgreen)](https://modelforge.dev/model-fit?model=Qwen%2FQwen2.5-32B-Instruct)
```
