# ModelForge Architecture Specification

## Overview

**ModelForge** is the open compute intelligence layer for AI inference. Given an AI model, workload, hardware environment, latency target, and cost constraint, ModelForge determines the optimal model + accelerator + runtime + precision + serving configuration with reproducible empirical proof.

```
                                  ┌───────────────────────────┐
                                  │    Developer / UI / CLI   │
                                  └─────────────┬─────────────┘
                                                │
                     ┌──────────────────────────┼──────────────────────────┐
                     ▼                          ▼                          ▼
            apps/web (Next.js)        apps/hf-space (Gradio)    packages/benchmark-cli
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

## Monorepo Layout

- `apps/web`: Production Next.js 15 App Router web platform. Provides public explorers, interactive calculators, leaderboards, and authenticated commercial console.
- `apps/hf-space`: Standalone deployable Gradio app for the Hugging Face Spaces ecosystem.
- `packages/benchmark-cli`: Python 3.12+ Typer CLI (`modelforge`) for hardware inspection, warmup/measured inference benchmarking, validation, and submission.
- `packages/benchmark-schema`: OpenComputeBench v1.0.0 Zod schema and SHA-256 deterministic hashing utilities.
- `packages/hardware-registry`: Canonical accelerator catalog and vendor provider interfaces (`AcceleratorProvider`).
- `packages/model-fit`: Mathematical explainable scoring engine (Memory, Performance, Runtime, Context, Efficiency, Confidence).
- `packages/optimizer`: Multi-objective Pareto optimization engine and deployment manifest generator (vLLM, Docker Compose, Kubernetes).
- `packages/database`: Database client, schema types, and deterministic local data layer.
- `packages/api-client`: Isomorphic type-safe client for the ModelForge REST API.

## Core Engineering Invariants

1. **Provenanced Benchmarks**: Every benchmark must have an immutable environment hash and result hash.
2. **Deterministic Integrity**: Synthetic development fixtures are tagged with `synthetic_fixture = true` and can never be marked as `verified`.
3. **Vendor Agnostic**: Accelerator hardware is abstracted through `AcceleratorProvider` (NVIDIA, AMD, Apple Silicon, Intel, CPU).
4. **Tenant Isolation**: Private enterprise workloads and benchmarks are isolated via PostgreSQL Row Level Security (RLS).
5. **No Blind Trust**: API keys are hashed with SHA-256 at rest; secrets never enter client bundles.
