# ModelForge Continuous Inference Optimization Architecture

## 1. Closed-Loop Telemetry Ingestion & Zero Prompt Logging

Traditional observability tools monitor infrastructure metrics (CPU load, RAM consumption, network I/O) without understanding LLM inference semantics. ModelForge ingests **model-aware telemetry windows** directly from production serving runtimes (vLLM, TensorRT-LLM, SGLang, Triton, NIM):

- Window duration ($T_{\text{start}}$ to $T_{\text{end}}$)
- Request throughput and total token volume
- Latency percentiles ($P_{50}, P_{90}, P_{95}, P_{99}$ TTFT and TPOT)
- Effective batch concurrency and KV cache saturation
- GPU utilization % and error rate %

### Zero Prompt Logging Guarantee

ModelForge enforces a strict constitutional privacy boundary: **no prompt text, user inputs, generation tokens, or chat messages are ever captured, transmitted, or stored**. Telemetry payloads containing text fields (`prompt`, `input_text`, `response`, `messages`) are rejected by the API layer with HTTP 400.

---

## 2. Drift Detection Algorithm

ModelForge continuously compares observed production performance against the deployment's expected baseline:

$$\Delta_{\text{TTFT}} = \frac{\text{TTFT}_{\text{observed}} - \text{TTFT}_{\text{expected}}}{\text{TTFT}_{\text{expected}}} \times 100\%$$

$$\Delta_{\text{Throughput}} = \frac{\text{Throughput}_{\text{observed}} - \text{Throughput}_{\text{expected}}}{\text{Throughput}_{\text{expected}}} \times 100\%$$

### Drift Status State Machine

1. **`NORMAL`**: Latency delta within $\pm 15\%$, error rate $< 0.05\%$.
2. **`WATCH`**: Latency delta $+20\%$ to $+40\%$, or GPU utilization $> 85\%$.
3. **`ACTION_RECOMMENDED`**: Latency delta $> +40\%$, concurrency surge $> 2.5\times$, or SLO attainment $< 95\%$. ModelForge automatically generates an optimization recommendation.
4. **`CRITICAL`**: Latency delta $> +80\%$ or error rate $> 2.0\%$. Requires immediate traffic shedding or replica autoscaling.

---

## 3. Human-in-the-Loop Governance

ModelForge adheres to a core enterprise safety principle: **Never automatically mutate production serving infrastructure without human sign-off**.

When drift is detected:

1. ModelForge analyzes the root cause (e.g. KV cache saturation during traffic surge).
2. The engine generates an `OptimizationRecommendation` with projected monthly savings and latency improvements.
3. The recommendation transitions to `ready_for_review`.
4. An authorized infrastructure administrator reviews the evidence and signs off via the Web UI or CLI (`modelforge recommendation approve`).
5. Only upon approval are updated Helm, KServe, or NVIDIA Dynamo manifests released to GitOps pipelines.
