# ModelForge AI FinOps & GPU Cost Optimization Architecture

## 1. The Core FinOps Principle: Projected vs. Verified Savings

Most cloud cost management tools claim speculative "projected savings" that never materialize in enterprise billing statements. ModelForge establishes a strict separation between **projected estimates** and **verified realized savings**:

```text
+------------------------------------+          +------------------------------------+
|       PROJECTED SAVINGS            |          |       VERIFIED REALIZED SAVINGS    |
| - Calculated pre-migration         |  Deploy  | - Calculated post-migration        |
| - Based on benchmark evidence      | =======> | - Verified across >= 30 days       |
| - ModelFit & Capacity Planner math |          | - Based on actual observed bills   |
| - Marked as UNVERIFIED             |          | - Auditable FinOps ledger          |
+------------------------------------+          +------------------------------------+
```

### Verification Formula

$$\text{Hourly Cost}_{\text{baseline}} = \frac{\text{Baseline Window Cost (\$)불}}{\text{Baseline Window Hours}}$$

$$\text{Hourly Cost}_{\text{after}} = \frac{\text{Observed After-State Cost (\$)불}}{\text{Observed After-State Hours}}$$

$$\text{Verified Realized Monthly Savings (\$)불} = \left( \text{Hourly Cost}_{\text{baseline}} - \text{Hourly Cost}_{\text{after}} \right) \times 730 \text{ hrs/mo}$$

---

## 2. GPU Right-Sizing Methodologies

Enterprises routinely over-provision H100 SXM5 clusters for workloads that do not saturate memory bandwidth or compute tensor cores. ModelForge identifies right-sizing opportunities across three primary archetypes:

### Archetype 1: HBM Under-Utilization Right-Sizing (H100 → L40S)

- **Symptom**: 32B or smaller models running on H100 with mean concurrency $< 6$ streams.
- **Root Cause**: The 3.35 TB/s HBM3 bandwidth of H100 is wasted when the model can be served within the 864 GB/s GDDR6 bandwidth of an NVIDIA L40S while still satisfying a 30 ms TTFT SLO.
- **FinOps Outcome**: 58% hourly cost reduction ($6.00/hr → $2.50/hr for 2 GPUs), yielding **$2,520 USD/month in verified savings per replica**.

### Archetype 2: Software Lift Without Hardware Modification (vLLM → TensorRT-LLM / Dynamo)

- **Symptom**: Serving throughput bottlenecks under traffic surges on existing hardware.
- **FinOps Solution**: Upgrading the serving engine from unoptimized vLLM to TensorRT-LLM in-flight batching yields a $+35\%$ throughput increase, eliminating the need to provision additional GPU nodes.

### Archetype 3: Idle Reserved Capacity Recovery

- **Symptom**: Reserved instances sitting at 0% utilization while on-demand instances are provisioned in another cloud region.
- **FinOps Solution**: ModelForge's Fleet Optimizer bin-packs eligible workloads into reserved instances first before allowing on-demand provisioning.

---

## 3. Cost-Per-Token Accounting

ModelForge computes exact cost per million tokens across every deployment plan and telemetry window:

$$\text{Cost per Million Tokens} = \frac{\text{Hourly GPU Cost}}{\text{Throughput (tokens/sec)} \times 3600} \times 1,000,000$$

This allows procurement teams to compare internal self-hosted deployments directly against proprietary API pricing (e.g. OpenAI, Anthropic, Google).
