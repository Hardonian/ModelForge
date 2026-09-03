# Workload Optimizer Engine

## Overview

The ModelForge Workload Optimizer solves the combinatorial equation of AI inference serving. Given a workload requirement and financial constraints, it discovers the Pareto-optimal frontier of hardware, precisions, runtimes, and accelerator counts.

## Problem Formulation

Given workload $W = \{ \text{model}, \text{context}, \text{prompt\_len}, \text{gen\_len}, \text{concurrency}, \text{volume} \}$, find configuration $C = \{ \text{accelerator}, \text{count}, \text{precision}, \text{runtime} \}$ satisfying:

1. **VRAM Constraint**: $VRAM_{req}(C, W) \le VRAM_{avail}(C)$
2. **Budget Constraint**: $\text{CostPerHour}(C) \le \text{MaxBudget}$
3. **Latency Constraint**: $TTFT_{p95}(C, W) \le TTFT_{target}$ and $TPOT_{p95}(C, W) \le TPOT_{target}$

While optimizing objective $O \in \{ \text{lowest\_cost}, \text{lowest\_latency}, \text{highest\_throughput}, \text{lowest\_vram}, \text{best\_balanced} \}$.

## Manifest Generation

For each winning candidate, the optimizer generates drop-in infrastructure manifests:
- **vLLM Docker Run**: Correct tensor-parallel flags, `--dtype`, `--kv-cache-dtype`, and GPU reservation flags.
- **Docker Compose YAML**: Production multi-container serving specification with health checks.
- **Kubernetes Pod YAML**: Resource limits, shared memory mounts (`/dev/shm`), and container spec.
