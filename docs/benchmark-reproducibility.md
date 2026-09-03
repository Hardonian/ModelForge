# OpenComputeBench Benchmark Reproducibility & Provenance

> **Standard:** OpenComputeBench Protocol v1.0.0  
> **Integrity Verification:** Multi-run variance &le; 5.0%, cryptographic environment and result hashing

---

## 1. The Reproducibility Crisis in AI Benchmarking

AI performance claims frequently suffer from unstated optimizations, thermal throttling, or synthetic shortcuts:

- Vendors report cherry-picked peak burst throughput rather than sustained P95 metrics.
- Benchmark scripts run with empty KV caches or pre-warmed prompts that do not match production distributions.
- Results omit driver versions, CUDA toolkits, and exact model revision hashes.

OpenComputeBench guarantees **auditability, reproducibility, and cryptographic integrity**.

---

## 2. Cryptographic Integrity Protocol

Every OpenComputeBench observation generates two SHA-256 hashes:

### 1. Environment Hash (`environment_hash`)

Computes SHA-256 over:

- Operating system, kernel version, CPU architecture.
- Accelerator vendor, model name, VRAM bytes, clock speed, PCIe/NVLink interconnect.
- Driver version, CUDA/ROCm runtime version.
- Inference framework name and exact package commit version.

### 2. Result Hash (`result_hash`)

Computes SHA-256 over:

- `benchmark_id` + `model_id` + `model_revision` + `environment_hash` + `throughput_tokens_per_second` + `p50_ttft_ms` + `p95_ttft_ms` + `peak_vram_bytes`.

Tampering with a single metric or hardware descriptor invalidates the record hash instantly.

---

## 3. Reproduction Workflow

```bash
# Pull an existing benchmark record and verify local reproducibility
modelforge reproduce 00000000-0000-0000-0000-000000000001
```

1. **Hardware Verification:** Checks that local accelerator matches the baseline record.
2. **Standardized Re-execution:** Re-runs identical prompt sequence lengths, context distributions, and concurrency.
3. **Delta Computation:** Computes throughput variance $\Delta_{\text{throughput}} = \left|\frac{T_{\text{repro}} - T_{\text{base}}}{T_{\text{base}}}\right| \times 100\%$.
4. **Attestation:** If $\Delta \le 5.0\%$, marks the benchmark as `VERIFIED_REPRODUCED`.
