# ModelForge ⚡

**The open compute intelligence layer for AI.**

> **From Hugging Face model to production infrastructure.**  
> Evidence-backed deployment intelligence for open AI. Given an AI model, revision, workload, latency target, and cost constraint, ModelForge compiles the optimal model + accelerator + runtime + precision + serving topology.

[![CI Status](https://img.shields.io/badge/CI-Passing-brightgreen.svg)](.github/workflows/modelforge-performance.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Schema: v2.0.0](https://img.shields.io/badge/ComputePassport-v2.0.0-indigo.svg)](docs/compute-passport.md)
[![Hugging Face Space](https://img.shields.io/badge/%F0%9F%A4%97%20Space-ModelForge-yellow.svg)](apps/hf-space)
[![Agents Guide](https://img.shields.io/badge/Agents-agents.md-purple.svg)](agents.md)

<!-- BEGIN: REPO HERO -->
![Repository hero generated locally on the GPU stack](assets/repo-hero.png)
<!-- END: REPO HERO -->

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
               │   @modelforge/benchmark-schema   (Compute Passport & Hash)      │
               │   @modelforge/slo-compiler       (SLO Solver & Dynamo Topology) │
               │   @modelforge/hardware-registry  (NVIDIA, AMD, Apple, CPU)      │
               │   @modelforge/model-fit          (Explainable 6-D & Workloads)  │
               │   @modelforge/optimizer          (Pareto Solver & Manifests)    │
               │   @modelforge/database           (PostgreSQL Multi-Tenant RLS)  │
               └─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Phase 2 Pillars

### 1. 🪪 Revision-Specific Compute Passports

Models like `Qwen/Qwen2.5-32B-Instruct` evolve over time. ModelForge binds verified execution profiles to exact commits (`org/model@revision`), tracking:

- Provenance tiers: `MEASURED` vs `DOCUMENTED` vs `DERIVED` vs `PREDICTED`.
- Memory profiles across FP16, FP8, and INT4.
- Execution compatibility across NVIDIA Dynamo, NIM, TensorRT-LLM, vLLM, SGLang, and llama.cpp.

### 2. ⚡ Inference SLO Compiler (`packages/slo-compiler`)

Turns vague sizing into exact infrastructure manifests. Given a context length, concurrency target, and P95 TTFT SLA:

- Solves Pareto-optimal serving topologies.
- Synthesizes disaggregated prefill/decode Kubernetes CRDs for **NVIDIA Dynamo** (`dynamo-config.yaml`).
- Generates turnkey container composition for **NVIDIA NIM** (`docker-compose.yaml`).

### 3. 🚀 Software Lift Metric (`/software-lift`)

Measures throughput gain and TTFT reduction achieved by upgrading the serving software on **identical hardware and workloads**:

- _Hopper H100 (70B FP8):_ Transformers (1.00x) &rarr; vLLM (1.78x) &rarr; TensorRT-LLM (2.31x) &rarr; Dynamo + TRT-LLM (2.71x).

### 4. 🛡️ Performance CI (`.modelforge.yml`)

Automated performance regression firewall in GitHub Actions. Fails PRs if throughput regresses > 5% or P95 TTFT rises > 10%.

---

## 💻 CLI Quickstart

```bash
# Install with uv
uv tool install modelforge

# 1. Fetch Compute Passport for an exact model revision
modelforge passport Qwen/Qwen2.5-32B-Instruct --revision main

# 2. Compile workload into ranked deployment topologies
modelforge plan workload.yaml

# 3. Generate deployable Dynamo or NIM manifests
modelforge deploy-plan workload.yaml --target dynamo --out-dir ./plan-output

# 4. Generate markdown badges for Hugging Face model cards
modelforge badge Qwen/Qwen2.5-32B-Instruct

# 5. Run Performance CI regression check
modelforge ci check --config .modelforge.yml
```

---

## 🤖 AI Agent & MCP Workflows

ModelForge exposes agent-native tools for Cursor, Windsurf, Claude Code, Antigravity, and Devin. See [agents.md](agents.md) for full tool definitions and JSON schemas.
