---
title: ModelForge - Open Compute Intelligence
emoji: ⚡
colorFrom: blue
colorTo: indigo
sdk: gradio
sdk_version: 5.16.0
app_file: app.py
pinned: false
license: apache-2.0
short_description: Determine optimal model + GPU + runtime + serving configuration.
---

# ModelForge: The Open Compute Intelligence Layer for AI

Given an AI model, workload, hardware environment, latency target, and cost constraint, ModelForge determines the optimal model + accelerator + runtime + precision + serving configuration.

## Features

- **ModelFit**: 6-dimension explainable scoring algorithm across memory, prefill/decode latency, runtime support, and context limits.
- **Workload Optimizer**: Multi-objective Pareto optimization across lowest cost, lowest latency, and highest throughput.
- **OpenComputeBench Browser**: Search reproducible benchmarks with cryptographic environment and result hashes.
- **Shareable Result Cards**: Generate visual benchmark cards for social sharing.
