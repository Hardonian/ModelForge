# ModelForge ⚡

**The open compute intelligence layer for AI.**

> Given an AI model, workload, hardware environment, latency target, quality requirement, concurrency target, context length, and cost constraint, ModelForge determines the optimal model + accelerator + runtime + precision + serving configuration.

[![CI Status](https://img.shields.io/badge/CI-Passing-brightgreen.svg)](https://github.com/Hardonian/ModelForge/actions)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Schema: v1.0.0](https://img.shields.io/badge/OpenComputeBench-v1.0.0-indigo.svg)](docs/BENCHMARK_SCHEMA.md)
[![Hugging Face Space](https://img.shields.io/badge/%F0%9F%A4%97%20Space-ModelForge-yellow.svg)](apps/hf-space)
[![Hugging Face Dataset](https://img.shields.io/badge/%F0%9F%A4%97%20Dataset-OpenComputeBench-orange.svg)](apps/web/app/datasets)

---

## 🏛️ Ecosystem Architecture

```
                                  ┌───────────────────────────┐
                                  │    Developer / UI / CLI   │
                                  └─────────────┬─────────────┘
                                                │
                     ┌──────────────────────────┼──────────────────────────┐
                     ▼                          ▼                          ▼
            apps/web (Next.js 15)      apps/hf-space (Gradio)    packages/benchmark-cli
                     │                          │                          │
                     └──────────────────────────┼──────────────────────────┘
                                                │
               ┌────────────────────────────────┴────────────────────────────────┐
               │                     Domain Engine Core                          │
               │                                                                 │
               │   @modelforge/benchmark-schema   (Zod & Hash Integrity)         │
               │   @modelforge/hardware-registry  (NVIDIA, AMD, Apple, CPU)      │
               │   @modelforge/model-fit          (Explainable 6-D Engine)       │
               │   @modelforge/optimizer          (Pareto Solver & Manifests)    │
               │   @modelforge/database           (PostgreSQL Multi-Tenant RLS)  │
               └─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart: Python Benchmark CLI

Inspect local host hardware, profile inference memory, execute benchmarks, and submit reproducible observations.

```bash
# Install with uv (recommended)
uv tool install modelforge

# 1. Run local environment doctor & hardware detection
modelforge doctor

# 2. Inspect model memory footprints across precisions
modelforge model inspect Qwen/Qwen2.5-32B-Instruct

# 3. Execute a reproducible benchmark run
modelforge benchmark Qwen/Qwen2.5-32B-Instruct --runtime vllm --precision fp8 --output run.json

# 4. Verify cryptographic hash integrity
modelforge validate run.json

# 5. Submit to the OpenComputeBench network
modelforge submit run.json
```

---

## 🌐 Quickstart: Web Platform & Turborepo

Run the production Next.js 15 web platform locally.

```bash
# 1. Install dependencies
pnpm install

# 2. Build monorepo packages
npx turbo run build

# 3. Start local development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access:
- **Matrix Explorer** (`/explore`)
- **Hardware Catalog** (`/hardware`)
- **Model Intelligence** (`/models`)
- **ModelFit Calculator** (`/model-fit`)
- **Workload Optimizer** (`/optimizer`)
- **Benchmark Registry** (`/benchmarks`)
- **Comparative Delta Analysis** (`/compare`)
- **Inference Leaderboards** (`/leaderboards`)
- **Authenticated Console** (`/dashboard`)

---

## 🎯 ModelFit: Explainable Compatibility Engine

ModelFit is not a subjective LLM opinion. It is a deterministic, explainable 0–100 composite scoring system:

$$\text{ModelFit} = 0.35 \cdot M + 0.25 \cdot P + 0.15 \cdot R + 0.10 \cdot C + 0.08 \cdot E + 0.07 \cdot K$$

1. **Memory Fit ($M$)**: Weight size + KV cache scaling vs physical device VRAM headroom. Hard-capped at 30 if OOM.
2. **Performance Fit ($P$)**: Prefill TTFT & decode bandwidth latency.
3. **Runtime Compatibility ($R$)**: Kernel acceleration & FlashAttention support.
4. **Context Fit ($C$)**: Requested workload context vs native training window.
5. **Efficiency Fit ($E$)**: Tokens per Watt and cloud FinOps amortization.
6. **Evidence Confidence ($K$)**: Provenance validation (verified lab run vs analytical model).

---

## 📦 Monorepo Structure

| Package / App | Description | Technology |
| :--- | :--- | :--- |
| [`apps/web`](apps/web) | Web platform & console | Next.js 15, React 19, Tailwind CSS |
| [`apps/hf-space`](apps/hf-space) | Hugging Face Space | Gradio 5.16+, Python |
| [`packages/benchmark-cli`](packages/benchmark-cli) | Benchmark agent CLI | Typer, Rich, Pydantic, uv |
| [`packages/benchmark-schema`](packages/benchmark-schema) | Schema & hashing | Zod, SHA-256 canonical hashing |
| [`packages/hardware-registry`](packages/hardware-registry) | Hardware catalog & providers | TypeScript, GPU/TPU specs |
| [`packages/model-fit`](packages/model-fit) | 6-D ModelFit engine | TypeScript math formulations |
| [`packages/optimizer`](packages/optimizer) | Workload Pareto solver | TypeScript, Docker/K8s generator |
| [`packages/database`](packages/database) | Database models & data layer | PostgreSQL, Supabase RLS |
| [`packages/api-client`](packages/api-client) | Isomorphic REST client | Fetch, typed endpoints |

---

## 🔒 Security & Data Integrity

- **Row Level Security (RLS)**: Strict tenant isolation across workloads, projects, and private benchmarks.
- **Zero-Knowledge API Keys**: Raw tokens are never stored; only SHA-256 hashes are persisted at rest.
- **Deterministic Hashing**: Every benchmark run generates immutable `environment_hash` and `result_hash` values.
- **Anti-Tampering Guardrails**: Synthetic fixtures are permanently barred from receiving verified status.

---

## 📚 Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [Benchmarking Guide](docs/BENCHMARKING.md)
- [Benchmark Schema (v1.0.0)](docs/BENCHMARK_SCHEMA.md)
- [ModelFit Algorithm](docs/MODELFIT.md)
- [Workload Optimizer](docs/OPTIMIZER.md)
- [REST API Reference](docs/API.md)
- [Commercial SaaS & FinOps](docs/COMMERCIAL_ARCHITECTURE.md)
- [Security & Isolation](docs/SECURITY.md)
- [Deployment Runbook](docs/DEPLOYMENT.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Roadmap](docs/ROADMAP.md)

---

## 📄 License

ModelForge and OpenComputeBench are open-source software licensed under the [Apache 2.0 License](LICENSE).
The OpenComputeBench benchmark dataset is licensed under [CDLA-Permissive-2.0](docs/BENCHMARK_SCHEMA.md).
