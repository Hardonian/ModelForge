# ModelFit Scoring Algorithm (v1.0.0)

## Overview

**ModelFit** is an explainable composite 0–100 scoring system that evaluates the compatibility of an AI model with a target hardware and serving runtime configuration.

## Dimensions & Weights

The overall composite score is a weighted linear combination of 6 independent sub-scores:

$$\text{ModelFit} = 0.35 \cdot M + 0.25 \cdot P + 0.15 \cdot R + 0.10 \cdot C + 0.08 \cdot E + 0.07 \cdot K$$

Where:
- $M$ = **Memory Fit (0–100)**: Evaluates physical VRAM headroom against weight size, KV cache scaling, and engine workspace buffers. If total required VRAM exceeds available VRAM ($is\_oom = true$), the overall score is hard-capped at 30/100.
- $P$ = **Performance Fit (0–100)**: Compares projected decode throughput (memory bandwidth bound) and TTFT against user latency targets.
- $R$ = **Runtime Compatibility (0–100)**: Validates architecture support, FlashAttention-2/3 kernels, and quantization precision acceleration (e.g. FP8 native support on Ada/Hopper/Blackwell/CDNA3).
- $C$ = **Context Fit (0–100)**: Evaluates requested context length relative to the model's native trained context window.
- $E$ = **Efficiency Fit (0–100)**: Assesses throughput generated per Watt of TDP and per dollar of cloud amortization.
- $K$ = **Evidence Confidence (0–100)**: Grounded in provenance—multi-run verified benchmark (98), validated community observation (82), or analytical performance model (52).

## Memory Footprint Formulation

$$VRAM_{required} = VRAM_{weights} + VRAM_{kv} + VRAM_{overhead}$$

1. **Weights Memory**:
   $$VRAM_{weights} = N_{params} \cdot \text{bytes\_per\_param}$$
   - FP16/BF16: 2.0 bytes
   - FP8: 1.0 byte
   - INT4 / AWQ: 0.55 bytes

2. **KV Cache Memory**:
   $$VRAM_{kv} = 2 \cdot N_{layers} \cdot N_{kv\_heads} \cdot D_{head} \cdot L_{context} \cdot \text{bytes\_per\_element} \cdot B_{concurrency}$$

3. **Activation & Engine Buffer**:
   $$VRAM_{overhead} = 0.15 \cdot VRAM_{weights} + 1.2\text{ GB}$$
