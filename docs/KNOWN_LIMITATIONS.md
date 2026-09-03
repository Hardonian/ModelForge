# MODELForge Known Limitations & Hardware Support Matrix

## 1. Scope & Transparency Policy

ModelForge provides empirical, evidence-grounded deployment recommendations and automated reconciliation. To maintain technical integrity, this document explicitly details current architectural boundaries, supported configurations, and operational limitations.

---

## 2. Hardware Acceleration Support Matrix

| Hardware Architecture | Tier | Serving Engines | Precisions Tested | Status |
| :--- | :---: | :--- | :--- | :---: |
| **NVIDIA H100 / H200 SXM5** | Deep Support | TensorRT-LLM, vLLM, NIM, Dynamo | FP8, FP16, BF16, INT4 | Production Verified |
| **NVIDIA L40S 48GB** | Deep Support | TensorRT-LLM, vLLM, NIM | FP8, FP16, BF16 | Production Verified |
| **NVIDIA A100 80GB SXM4** | Deep Support | TensorRT-LLM, vLLM | FP16, BF16, INT4 | Production Verified |
| **NVIDIA RTX 4090 24GB** | Deep Support | vLLM, TensorRT-LLM | FP16, INT4 (AWQ) | Production Verified |
| **NVIDIA B200 Blackwell** | Preliminary | TensorRT-LLM, Dynamo | FP4, FP8, FP16 | Simulated / Early Access |
| **AMD Instinct MI300X** | Community | vLLM, ROCm | FP16, FP8 | Community Verified |
| **Apple Silicon (M3/M4 Max/Ultra)** | Development | MLX, llama.cpp | FP16, INT4, INT8 | Local Profiling Only |
| **Google Cloud TPU v5e/v5p** | Advisory | vLLM TPU / JetStream | BF16, INT8 | Deployment Plan Generation Only |

---

## 3. Operational & Runtime Boundaries

1. **Remote Code Execution Policy**: By default, ModelForge disables Hugging Face `trust_remote_code=True`. Custom model architectures containing non-standard Python execution code must run inside isolated sandboxes.
2. **Kubernetes Version Compatibility**: `KubernetesExecutionProvider` requires Kubernetes >= 1.26 for native Server-Side Apply and Gateway API traffic-splitting primitives.
3. **Disaggregated Prefill/Decode**: NVIDIA Dynamo prefill/decode disaggregation requires high-bandwidth RDMA/RoCE interconnect between nodes; single-node deployments automatically use unified instances.
4. **Out-of-Band Control Boundary**: ModelForge never proxies live user prompt requests or generated outputs. Telemetry ingestion receives only latency histograms and aggregate token metrics.
