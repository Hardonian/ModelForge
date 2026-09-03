# OpenComputeBench Benchmarking Guide

## Principles of Reproducible Benchmarking

ModelForge treats inference benchmarking as an exact empirical discipline. Fabricated numbers, single-run anomalies, and marketing claims without exact software and hardware hashes are strictly disallowed.

### 1. Two-Phase Measurement Protocol
Every benchmark executed by the `modelforge` CLI agent runs in two strictly demarcated phases:
- **Phase 1: Warmup & JIT Compilation (10 iterations)**: Pre-populates KV caches, compiles CUDA/ROCm execution graphs (TensorRT-LLM / vLLM cudagraphs), and warms GPU memory controllers to steady-state clock frequencies.
- **Phase 2: Measured Sampling (20+ iterations)**: Measures raw TTFT, TPOT, tokens/second, requests/second, and peak VRAM allocation under steady-state thermal conditions.

### 2. Metric Formulations
- **Time to First Token (TTFT)**: Pre-fill latency from request dispatch to emission of the very first generated token. Measured across `p50`, `p90`, `p95`, `p99`, `mean`, and `std_dev`.
- **Time Per Output Token (TPOT)**: Autoregressive decoding latency per token. Calculated as `(Total Generation Time - TTFT) / Generated Tokens`.
- **Throughput (Tokens/sec)**: Total tokens generated across all concurrent streams divided by total wall-clock time.
- **Memory Waterfall**:
  $$\text{Total VRAM} = \text{Model Weights} + \text{KV Cache}(c, l, h, d) + \text{Activation Overhead} + \text{CUDA Context Buffer}$$

### 3. Verification States
- `unverified`: Benchmark submitted from an unauthenticated or local development node.
- `community`: Benchmark submitted with matching valid environment hashes and realistic latency distributions.
- `reproduced`: Benchmark independently duplicated by at least 2 separate contributor nodes with matching result hashes within ±5% tolerance.
- `verified`: Benchmark executed or confirmed on official ModelForge lab clusters.
- `synthetic_fixture`: Local test or simulation fixture. Invariant rule: Can **never** be labeled as verified.
