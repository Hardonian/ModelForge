# ModelForge Cost Intelligence & Token Economics

> **Target:** Accurate Cost per 1 Million Tokens across Cloud, Dedicated, and Hybrid Deployments

---

## 1. Blended Token Cost Modeling

ModelForge computes exact token economics by combining:
1. **Hardware Capital / Cloud Rental Cost:** Hourly compute rate ($/hr) based on spot vs on-demand pricing across major cloud providers (AWS, GCP, Azure, Lambda Labs, RunPod, Nebius).
2. **Sustained Throughput:** Real measured tokens/second under actual production concurrency and arrival distributions (not synthetic single-stream maximums).
3. **KV Cache & Memory Utilization:** Overhead factor accounting for idle memory reservations during bursty request intervals.

$$\text{Cost per 1M Tokens} = \frac{\text{Hourly GPU Cost} \ (\$/\text{hr})}{\text{Sustained Throughput} \ (\text{tok/s}) \times 3600} \times 1,000,000$$

---

## 2. Cost Profiles: 32B Model (Qwen2.5-32B / DeepSeek-R1-32B)

| Accelerator | Runtime & Precision | Sustained TPS | Hourly Cost ($/hr) | Blended Cost / 1M Tok |
|---|---|---|---|---|
| **NVIDIA L40S 48GB** | vLLM (FP8) | 72.4 tok/s | $1.15 | **$0.32** |
| **NVIDIA L40S 48GB (2x)** | Dynamo Disaggregated | 86.8 tok/s | $2.30 | **$0.38** (62% lower TTFT) |
| **NVIDIA H100 SXM5 80GB** | TensorRT-LLM (FP8) | 88.6 tok/s | $3.20 | **$0.85** |
| **RTX 4090 24GB (Self-Hosted)** | llama.cpp (INT4) | 44.2 tok/s | $0.25 (PUE amortized) | **$0.12** |

---

## 3. Workload Cost Optimization

Through `@modelforge/optimizer` and the SLO Compiler, users can set strict cost ceilings:
```yaml
slo:
  max_cost_per_million_tokens_usd: 0.50
  optimize_for: "cost"
```
The solver automatically filters out configurations exceeding the ceiling and ranks viable options by cost efficiency.
