---
annotations_creators:
- machine-generated
language:
- en
license: cdla-permissive-2.0
size_categories:
- n<1K
task_categories:
- text-generation
- conversational
- question-answering
tags:
- opencomputebench
- modelforge
- llm-inference
- compute-passports
- gpu-benchmarks
- inference-benchmarks
pretty_name: OpenComputeBench v1.0 Inference Benchmark Dataset
dataset_info:
  features:
  - name: benchmark_id
    dtype: string
  - name: schema_version
    dtype: string
  - name: golden
    dtype: bool
  - name: model
    struct:
    - name: provider
      dtype: string
    - name: repository
      dtype: string
    - name: revision
      dtype: string
    - name: architecture
      dtype: string
    - name: parameters_billions
      dtype: float64
  - name: hardware
    struct:
    - name: vendor
      dtype: string
    - name: device
      dtype: string
    - name: count
      dtype: int64
    - name: vram_bytes_per_device
      dtype: int64
    - name: interconnect
      dtype: string
  - name: runtime
    struct:
    - name: name
      dtype: string
    - name: version
      dtype: string
  - name: precision
    struct:
    - name: type
      dtype: string
    - name: quantization_method
      dtype: string
  - name: workload
    struct:
    - name: prompt_tokens
      dtype: int64
    - name: generated_tokens
      dtype: int64
    - name: context_length
      dtype: int64
    - name: concurrency
      dtype: int64
  - name: metrics
    struct:
    - name: tokens_per_second
      dtype: float64
    - name: requests_per_second
      dtype: float64
    - name: peak_vram_bytes
      dtype: int64
    - name: ttft_ms
      dtype: struct
    - name: tpot_ms
      dtype: struct
  - name: provenance
    struct:
    - name: submitted_by
      dtype: string
    - name: runner_version
      dtype: string
    - name: environment_hash
      dtype: string
    - name: result_hash
      dtype: string
---

# OpenComputeBench v1.0 Public Dataset

OpenComputeBench is the open, reproducible, cryptographically verifiable benchmark specification for generative AI inference.

## Dataset Summary

This dataset contains canonical, empirical inference benchmark records evaluating open foundation models across modern accelerator hardware and inference serving runtimes. Every record in this dataset contains:

1. **Exact Hugging Face Model Revision**: Tracked by immutable commit SHA.
2. **Standardized Hardware Profiles**: Normalized accelerator memory, vendor, and interconnect specifications.
3. **Runtime & Engine Configuration**: Exact runtime versions (`vLLM`, `TensorRT-LLM`, `NVIDIA Dynamo`, `NVIDIA NIM`, `llama.cpp`) and serving hyperparameters.
4. **SLO Latency Distributions**: TTFT (Time-To-First-Token) and TPOT (Time-Per-Output-Token) P50, P90, P95, and P99 metrics.
5. **Cryptographic Integrity Hashes**: `environment_hash` and `result_hash` computed over hardware telemetry and benchmark output distributions to detect tampering.
6. **Provenance & Verification**: Explicit categorization (`MEASURED`, `REPRODUCED`, `DOCUMENTED`) and Golden Benchmark status.

## Data Structure

Data files are delivered in JSON Lines (`.jsonl`) format following the `OpenComputeBenchRecord` schema:

```json
{
  "benchmark_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "schema_version": "1.0.0",
  "golden": true,
  "synthetic_fixture": false,
  "model": {
    "provider": "Qwen",
    "repository": "Qwen/Qwen2.5-32B-Instruct",
    "revision": "main",
    "architecture": "Qwen2ForCausalLM",
    "parameters_billions": 32.5
  },
  "runtime": {
    "name": "vllm",
    "version": "0.6.4"
  },
  "precision": {
    "type": "fp8",
    "quantization_method": "fp8_e4m3"
  },
  "hardware": {
    "vendor": "nvidia",
    "device": "NVIDIA L40S",
    "count": 1,
    "vram_bytes_per_device": 51539607552,
    "interconnect": "pcie_gen4"
  },
  "metrics": {
    "tokens_per_second": 72.4,
    "peak_vram_bytes": 38654705664,
    "ttft_ms": { "p50_ms": 280, "p95_ms": 330 },
    "tpot_ms": { "p50_ms": 13.8, "p95_ms": 15.1 }
  },
  "provenance": {
    "submitted_by": "ModelForge-Core-Lab",
    "environment_hash": "...",
    "result_hash": "..."
  }
}
```

## Licensing

The OpenComputeBench dataset is released under the **Community Data License Agreement – Permissive – Version 2.0 (CDLA-Permissive-2.0)**. You may freely use, share, modify, and build commercial applications upon this data with attribution.

## Citation

```bibtex
@misc{modelforge2025opencomputebench,
  title={OpenComputeBench: The Open Deployment Intelligence Layer for AI Inference},
  author={ModelForge Team},
  year={2025},
  publisher={Hugging Face},
  url={https://huggingface.co/datasets/ModelForge/OpenComputeBench}
}
```
