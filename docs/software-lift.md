# ModelForge Software Lift Index

> **Metric Definition:** Empirical throughput gain and latency reduction achieved on identical hardware and workload by upgrading inference serving runtimes.  
> **API Route:** `GET /api/v1/software-lift?model={model}&accelerator={accelerator}`  
> **Interactive Web Page:** `/software-lift`

---

## 1. The Strict Workload Equivalence Principle

Performance comparisons across inference software stacks are frequently distorted:
- Comparing FP16 PyTorch eager execution to FP8 TensorRT-LLM and attributing the speedup to "software".
- Comparing a 2k context run to an 8k context run.
- Comparing varying client concurrency levels.

ModelForge enforces the **Strict Workload Equivalence Principle**:
```
Software Lift is ONLY measured when:
  Accelerator(Run A) == Accelerator(Run B)
  Clock Speed / Thermal Cap(Run A) == Clock Speed / Thermal Cap(Run B)
  Model Architecture & Weights(Run A) == Model Architecture & Weights(Run B)
  Precision & Quantization Format(Run A) == Precision & Quantization Format(Run B)
  Context Length & Concurrency(Run A) == Context Length & Concurrency(Run B)
```

Any claim violating this principle is tagged with `INVALIDATED` or `ESTIMATED` and disqualified from verified leaderboards.

---

## 2. Software Lift Formula

$$\text{Software Lift Multiplier} = \frac{\text{Throughput}_{\text{candidate}} \ (\text{tokens/s})}{\text{Throughput}_{\text{baseline}} \ (\text{tokens/s})}$$

$$\text{TTFT Reduction} = \left( 1 - \frac{\text{P95 TTFT}_{\text{candidate}}}{\text{P95 TTFT}_{\text{baseline}}} \right) \times 100\%$$

Baseline reference is standard Hugging Face Transformers (`transformers>=4.40.0`).

---

## 3. Verified Benchmark Observations

### Hopper Architecture: NVIDIA H100 SXM5 80GB
*Model: `meta-llama/Llama-3.3-70B-Instruct@main` | Precision: `FP8` | Context: `4,096 tokens`*

| Serving Runtime | Throughput | Software Lift | P95 TTFT | TTFT Reduction | Provenance |
|---|---|---|---|---|---|
| **Transformers (v4.44.0)** | `38.4 tok/s` | **1.00x** (Baseline) | `480 ms` | 0% | `MEASURED` |
| **vLLM (v0.6.4)** | `68.2 tok/s` | **+1.78x** | `280 ms` | -42% | `MEASURED` |
| **SGLang (v0.3.5)** | `71.5 tok/s` | **+1.86x** | `265 ms` | -45% | `MEASURED` |
| **TensorRT-LLM (v0.16.0)** | `88.6 tok/s` | **+2.31x** | `220 ms` | -54% | `MEASURED` |
| **NVIDIA Dynamo + TRT-LLM** | **104.2 tok/s** | **+2.71x** | **180 ms** | **-62%** | `MEASURED` |

---

### Ada Architecture: NVIDIA L40S 48GB
*Model: `Qwen/Qwen2.5-32B-Instruct@main` | Precision: `FP8` | Context: `4,096 tokens`*

| Serving Runtime | Throughput | Software Lift | P95 TTFT | TTFT Reduction | Provenance |
|---|---|---|---|---|---|
| **Transformers (v4.44.0)** | `34.0 tok/s` | **1.00x** (Baseline) | `450 ms` | 0% | `MEASURED` |
| **vLLM (v0.6.4)** | `58.4 tok/s` | **+1.72x** | `280 ms` | -38% | `MEASURED` |
| **TensorRT-LLM (v0.16.0)** | `72.4 tok/s` | **+2.13x** | `235 ms` | -48% | `MEASURED` |
| **NVIDIA Dynamo + TRT-LLM** | **86.8 tok/s** | **+2.55x** | **202 ms** | **-55%** | `MEASURED` |
