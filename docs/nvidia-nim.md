# NVIDIA NIM Intelligence & Deployment Composition

> **Architecture:** Turnkey NVIDIA Inference Microservices (NIM)  
> **Registry:** `nvcr.io/nim/*`  
> **Compiler Target:** `@modelforge/slo-compiler` -> `targets/nim.ts`

---

## 1. What is NVIDIA NIM?

NVIDIA NIM (NVIDIA Inference Microservice) packages model weights, TensorRT-LLM optimized engines, CUDA drivers, and standard OpenAI-compatible HTTP/gRPC inference servers into a turnkey, production-grade container.

ModelForge provides turnkey intelligence for NIM deployments:
1. **Container Repository Resolution:** Maps canonical Hugging Face identifiers (`meta-llama/Llama-3.3-70B-Instruct`) to exact NGC container tags (`nvcr.io/nim/meta/llama-3.3-70b-instruct:latest`).
2. **GPU Sizing & VRAM Constraints:** Pre-computes minimum GPU slice allocations and tensor parallel requirements.
3. **Health Probes & Kubernetes Specs:** Generates ready-to-deploy `docker-compose.yaml` and Kubernetes Pod definitions with liveness/readiness probes configured for NIM's `/v1/health/ready` endpoint.

---

## 2. Generated Docker Compose Manifest

```yaml
version: '3.8'

services:
  nim-serving:
    image: nvcr.io/nim/meta/llama-3.3-70b-instruct:latest
    container_name: modelforge-nim-serving
    environment:
      - NGC_API_KEY=${NGC_API_KEY}
      - MODEL_NAME=meta-llama/Llama-3.3-70B-Instruct
      - TENSOR_PARALLEL_SIZE=1
      - PIPELINE_PARALLEL_SIZE=1
    ports:
      - "8000:8000"
    volumes:
      - nim-cache:/opt/nim/.cache
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/v1/health/ready"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  nim-cache:
    driver: local
```

---

## 3. When to Choose NIM vs Dynamo vs vLLM

| Dimension | NVIDIA NIM | NVIDIA Dynamo | vLLM |
|---|---|---|---|
| **Setup Complexity** | Zero (Turnkey Container) | Moderate (Kubernetes Operator) | Low (Docker / Pip) |
| **Prefill/Decode Split** | Monolithic Engine | Disaggregated (Highest Lift) | Monolithic Engine |
| **Enterprise Support** | NVIDIA AI Enterprise | NVIDIA Open / Cloud | Open-Source Community |
| **Hardware** | NVIDIA GPUs Only | NVIDIA GPUs (Hopper/Ada) | NVIDIA, AMD ROCm, Intel |
