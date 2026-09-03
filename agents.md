# ModelForge for AI Coding Agents & MCP Workflows

> **Tagline:** The open compute intelligence layer for AI.  
> **API Schema Version:** 2.0.0  
> **Target Audience:** Autonomous coding agents (Antigravity, Claude Code, Cursor, Windsurf, Devin), CI bots, and ML platform engineers.

---

## 1. Executive Summary for Agents

When generating code, provisioning Kubernetes infrastructure, or selecting LLM serving runtimes, AI coding agents often make flawed assumptions about GPU VRAM, batch sizes, tensor parallelism, and runtime overhead.

ModelForge provides **agent-native tools and structured schemas** so agents can query empirical compute evidence rather than guessing.

### Core Premise
```
HF Model @ Revision + Workload + Latency SLA + Cost Target
           ↓ (ModelForge SLO Compiler)
Optimal Topology (NVIDIA Dynamo / NIM / vLLM / SGLang) + Verifiable Manifests
```

---

## 2. MCP Tools Reference

ModelForge provides an agent-native Model Context Protocol (MCP) server exposing the following toolset:

### `get_compute_passport`
Retrieves revision-specific evidence, verified runtime compatibilities, and memory profiles.
```json
{
  "name": "get_compute_passport",
  "description": "Fetch the verified Compute Passport for a Hugging Face model revision.",
  "parameters": {
    "type": "object",
    "properties": {
      "model_id": { "type": "string", "description": "e.g. Qwen/Qwen2.5-32B-Instruct" },
      "revision": { "type": "string", "default": "main", "description": "Exact commit hash or tag" }
    },
    "required": ["model_id"]
  }
}
```

### `compile_slo`
Compiles an inference workload and latency target into ranked serving topologies.
```json
{
  "name": "compile_slo",
  "description": "Synthesize optimal serving topology matching latency and cost SLOs.",
  "parameters": {
    "type": "object",
    "properties": {
      "model_id": { "type": "string" },
      "revision": { "type": "string", "default": "main" },
      "workload": {
        "type": "object",
        "properties": {
          "task_type": { "type": "string", "enum": ["rag", "code_generation", "general_chat", "batch_eval"] },
          "target_concurrency": { "type": "integer", "default": 8 },
          "context_length": { "type": "integer", "default": 4096 }
        }
      },
      "slo": {
        "type": "object",
        "properties": {
          "max_p95_ttft_ms": { "type": "number", "default": 400 },
          "max_cost_per_1m_tokens_usd": { "type": "number", "default": 1.50 }
        }
      }
    },
    "required": ["model_id", "workload"]
  }
}
```

### `generate_dynamo_plan`
Generates a Kubernetes Custom Resource (`DynamoServingDeployment`) with disaggregated prefill/decode topology.
```json
{
  "name": "generate_dynamo_plan",
  "description": "Generate NVIDIA Dynamo disaggregated prefill/decode serving manifests."
}
```

### `generate_nim_plan`
Generates turnkey NVIDIA NIM container composition and health checks.
```json
{
  "name": "generate_nim_plan",
  "description": "Generate NVIDIA NIM turnkey container compose manifests."
}
```

### `get_software_lift`
Queries empirical throughput multipliers between Transformers baseline, vLLM, TensorRT-LLM, and Dynamo.
```json
{
  "name": "get_software_lift",
  "description": "Query software efficiency gains holding hardware and workload strictly identical."
}
```

---

## 3. Recommended Agent Workflows

### Scenario A: Sizing an LLM for Production Deployment
1. Agent receives request: *"Deploy DeepSeek-R1-Distill-Qwen-32B for a customer support bot with 500ms TTFT"*.
2. Agent queries `get_compute_passport(model_id="deepseek-ai/DeepSeek-R1-Distill-Qwen-32B")`.
3. Agent checks memory requirements: minimum 24GB VRAM for FP8, recommended 48GB (L40S or A100).
4. Agent invokes `compile_slo(...)` with `task_type="rag"`, `max_p95_ttft_ms=500`.
5. Agent outputs `dynamo-config.yaml` or `docker-compose.yaml` with zero hallucinated parameters.

### Scenario B: CI Performance Guardrails
1. When submitting PRs that upgrade model weights, quantized engines, or vLLM versions:
2. Run `modelforge ci check --config .modelforge.yml`.
3. Detects if throughput drops > 5% or P95 TTFT increases > 10%.

---

## 4. REST API Quick Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/models/{org}/{model}/passport` | `GET` | Get revision-specific compute passport |
| `/api/v1/plans` | `POST` | Compile workload and SLO into deployment plan |
| `/api/v1/slo/compile` | `POST` | Direct SLO compiler endpoint |
| `/api/v1/software-lift` | `GET` | Query software lift metrics across runtimes |
| `/api/v1/benchmarks/{id}/reproduce` | `POST` | Verify empirical benchmark reproduction |

---

## 5. Provenance Principles for AI Agents
When conveying performance figures to users, AI agents **MUST** distinguish evidence provenance:
- **`MEASURED`**: Empirical data from verifiable multi-run GPU execution.
- **`DOCUMENTED`**: Vendor official documentation or engineering whitepapers.
- **`DERIVED`**: Computed from mathematical memory models and roofline formulas.
- **`PREDICTED`**: Regression-estimated from adjacent parameter architectures.
- **`UNKNOWN`**: Unvalidated configuration.
