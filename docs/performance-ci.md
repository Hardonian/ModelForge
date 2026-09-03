# ModelForge Performance CI & Continuous Benchmarking

> **Configuration File:** `.modelforge.yml`  
> **GitHub Action:** `.github/workflows/modelforge-performance.yml`  
> **CLI Commands:** `modelforge ci baseline`, `modelforge ci check`, `modelforge ci compare`

---

## 1. Why Performance CI?

Standard software CI gates check unit tests, linting, and security vulnerabilities. However, in generative AI systems:

- A new quantization kernel might silently introduce a 15% latency penalty.
- A tokenizer change might cause context padding to blow up KV cache memory.
- A serving engine bump might regress P95 Time-to-First-Token (TTFT) by 40%.

ModelForge Performance CI acts as an **automated performance regression firewall** in your pull request workflow.

---

## 2. Configuration (`.modelforge.yml`)

```yaml
version: 1

model:
  repo: "Qwen/Qwen2.5-32B-Instruct"
  revision: "main"

workloads:
  - name: "customer-support-rag"
    task_type: "rag"
    context_length: 4096
    concurrency: 8
    target_ttft_ms: 350

hardware:
  primary: "NVIDIA L40S 48GB"

thresholds:
  throughput_regression_percent: 5.0   # Fail if tok/s drops > 5%
  ttft_regression_percent: 10.0        # Fail if P95 TTFT rises > 10%
  vram_regression_percent: 8.0         # Fail if peak VRAM increases > 8%
```

---

## 3. GitHub Actions Workflow

Add `.github/workflows/modelforge-performance.yml` to your repo:

```yaml
name: ModelForge Performance CI

on:
  pull_request:
    branches: [main]

jobs:
  performance-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - uses: astral-sh/setup-uv@v3
      - run: uv pip install -e packages/benchmark-cli
      - run: modelforge ci check --config .modelforge.yml
```

---

## 4. Pull Request Comment Output

When running in CI, ModelForge posts a markdown table to the GitHub pull request:

| Metric | Baseline | Current Run | Delta % | Threshold | Status |
| --- | --- | --- | --- | --- | --- |
| **Throughput (tok/s)** | 72.4 | 71.0 | -1.9% | -5.0% max drop | ✅ **PASS** |
| **P95 TTFT (ms)** | 280.0 | 290.0 | +3.5% | +10.0% max rise | ✅ **PASS** |
| **Peak VRAM (GB)** | 38.6 | 38.8 | +0.5% | +8.0% max rise | ✅ **PASS** |

If any regression exceeds its configured threshold, the job exits with non-zero status code `1`, blocking the merge.
