# ModelForge Inference Performance Prediction Engine

## 1. Mathematical Principles & Hybrid Architecture

The ModelForge Performance Prediction Engine estimates latency, throughput, and memory bounds for untested model and hardware configurations. It prevents "hallucinated benchmarks" by pairing physics-based roofline modeling with distance-weighted empirical scaling from the OpenComputeBench graph.

---

## 2. Level 0: Analytical Roofline Model

In large language model serving, token generation splits into two distinct phases:

### Phase A: Time to First Token (TTFT) — Compute-Bound Prefill

For a prompt containing $P$ tokens processed across a model with $N$ billion parameters:

$$\text{FLOPs}_{\text{prefill}} = 2 \times N \times 10^9 \times P$$

The compute-bound prefill duration on an accelerator delivering $T_{\text{hardware}}$ TFLOPs is:

$$\text{TTFT}_{\text{compute}} = \frac{\text{FLOPs}_{\text{prefill}}}{T_{\text{hardware}} \times 10^{12} \times \eta_{\text{runtime}}}$$

Where $\eta_{\text{runtime}}$ represents runtime kernel execution efficiency (e.g. 0.88 for TensorRT-LLM, 0.78 for vLLM).

### Phase B: Time Per Output Token (TPOT) — Memory-Bandwidth-Bound Decode

During autoregressive token generation, model weights must be streamed from High Bandwidth Memory (HBM) into SRAM for every generated token:

$$\text{Weight Memory (GB)} = N \times \text{Bytes Per Parameter}$$

$$\text{TPOT}_{\text{memory}} = \frac{\text{Weight Memory (GB)}}{\text{Effective Memory Bandwidth (GB/s)}} \times 1000 \text{ ms}$$

### KV Cache Memory Footprint

The Key-Value (KV) cache memory requirement scales linearly with context length $C$, batch concurrency $B$, layer count $L$, and KV head count $H_{\text{kv}}$:

$$\text{Memory}_{\text{KV}} = 2 \times L \times H_{\text{kv}} \times D_{\text{head}} \times \text{Bytes Per Element} \times C \times B$$

---

## 3. Level 1: Empirical Nearest-Neighbor Interpolation

Analytical equations provide foundational lower bounds, but production serving introduces dynamic effects (KV paging overhead, CUDA graph launch latency, in-flight batching schedules). 

Level 1 searches the OpenComputeBench corpus for the $k$-nearest verified empirical configurations. Distance $D$ between target configuration $x$ and corpus record $r$ is computed across logarithmic parameter ratio, hardware similarity, runtime, and precision:

$$D(x, r) = 1.5 \cdot \left| \ln \left( \frac{N_x}{N_r} \right) \right| + 0.8 \cdot \mathbb{I}_{\Delta \text{HW}} + 0.5 \cdot \mathbb{I}_{\Delta \text{Runtime}} + 0.3 \cdot \mathbb{I}_{\Delta \text{Precision}}$$

The blended prediction combines empirical nearest-neighbor scaling with analytical bounds:

$$\hat{y} = 0.70 \cdot \left( y_{\text{nearest}} \cdot \left( \frac{N_r}{N_x} \right)^{0.9} \right) + 0.30 \cdot y_{\text{analytical}}$$

---

## 4. Uncertainty Classification & Prediction Intervals

ModelForge categorizes uncertainty into three strict classifications:

| Uncertainty Classification | Nearest Distance $D$ | Confidence | Prediction Interval |
| :--- | :--- | :--- | :--- |
| **`INTERPOLATION`** | $D < 0.35$ | High | $\pm 10\%$ ($P_{10} - P_{90}$) |
| **`EXTRAPOLATION`** | $0.35 \le D < 1.2$ | Medium | $\pm 20\%$ ($P_{10} - P_{90}$) |
| **`OUT_OF_DISTRIBUTION`** | $D \ge 1.2$ | Low | $\pm 35\%$ ($P_{10} - P_{90}$) |

---

## 5. Ground Truth Invariance

1. **Explicit Labeling**: Every prediction output contains `is_predicted: true`.
2. **Never Overwrite**: Predicted values are never stored into the `benchmarks` table and are never treated as measured evidence.
3. **Traceable Anchor**: Predictions must cite their `nearest_evidence_benchmark_ids` to show which measured runs anchored the calculation.
