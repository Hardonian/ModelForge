# ModelForge for AI Coding Agents & MCP Workflows

> **Tagline:** The open compute intelligence layer for AI.  
> **API Schema Version:** 2.0.0  
> **Target Audience:** Autonomous coding agents (Antigravity, Claude Code, Cursor, Windsurf, Devin), CI bots, and ML platform engineers.

---

## 1. Executive Summary for Agents

When generating code, provisioning Kubernetes infrastructure, or selecting LLM serving runtimes, AI coding agents often make flawed assumptions about GPU VRAM, batch sizes, tensor parallelism, and runtime overhead.

ModelForge provides **agent-native tools and structured schemas** so agents can query empirical compute evidence rather than guessing.

### Core Premise

```text
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
      "model_id": {
        "type": "string",
        "description": "e.g. Qwen/Qwen2.5-32B-Instruct"
      },
      "revision": {
        "type": "string",
        "default": "main",
        "description": "Exact commit hash or tag"
      }
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
          "task_type": {
            "type": "string",
            "enum": ["rag", "code_generation", "general_chat", "batch_eval"]
          },
          "target_concurrency": { "type": "integer", "default": 8 },
          "context_length": { "type": "integer", "default": 4096 }
        }
      },
      "slo": {
        "type": "object",
        "properties": {
          "max_p95_ttft_ms": { "type": "number", "default": 400 },
          "max_cost_per_1m_tokens_usd": { "type": "number", "default": 1.5 }
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
### `get_google_tpu_topology`

Calculates optimal Google Cloud TPU v5e, v5p, or v6e Trillium slice dimensions (`2x2x1`, `2x2x2`, `2x2x4`, `4x4x4`), ICI optical interconnect bandwidth, and GKE node selectors.

```json
{
  "name": "get_google_tpu_topology",
  "description": "Calculate optimal Google Cloud TPU slice topology and inter-chip optical interconnect parameters.",
  "parameters": {
    "type": "object",
    "properties": {
      "model_id": { "type": "string" },
      "tpu_generation": { "type": "string", "enum": ["tpu-v5p", "tpu-v6e", "tpu-v5e"], "default": "tpu-v5p" },
      "context_length": { "type": "integer", "default": 8192 },
      "target_concurrency": { "type": "integer", "default": 16 }
    },
    "required": ["model_id"]
  }
}
```

### `export_vertex_manifest`

Generates ready-to-deploy Google Cloud Vertex AI Custom Endpoint and Model resource configuration with machine type and accelerator allocation.

```json
{
  "name": "export_vertex_manifest",
  "description": "Generate deployable Google Cloud Vertex AI Custom Endpoint and Model resource configuration.",
  "parameters": {
    "type": "object",
    "properties": {
      "model_id": { "type": "string" },
      "accelerator_type": { "type": "string", "enum": ["TPU_V5P", "TPU_V6E", "TPU_V5e", "NVIDIA_H100_80GB", "NVIDIA_L4"] },
      "accelerator_count": { "type": "integer", "default": 4 }
    },
    "required": ["model_id"]
  }
}
```

### `apply_hot_patch_action`

Applies a live, in-memory zero-downtime hot-patch (e.g. KV-cache FP8 quantization or LoRA adapter swap) with instantaneous verification and rollback tokens.

```json
{
  "name": "apply_hot_patch_action",
  "description": "Execute live zero-downtime hot-patch on active serving deployment.",
  "parameters": {
    "type": "object",
    "properties": {
      "deployment_id": { "type": "string" },
      "patch_type": { "type": "string", "enum": ["quantize_kv_cache", "swap_lora_adapter", "adjust_batch_timeout"] },
      "target_precision": { "type": "string", "default": "fp8" }
    },
    "required": ["deployment_id", "patch_type"]
  }
}
```

### `export_bigquery_telemetry_schema`

Retrieves the Google BigQuery table DDL, partitioning specification, and analytical view definitions for ModelForge inference telemetry.

```json
{
  "name": "export_bigquery_telemetry_schema",
  "description": "Retrieve Google BigQuery schema DDL and analytical view definitions.",
  "parameters": {
    "type": "object",
    "properties": {
      "dataset_id": { "type": "string", "default": "modelforge_telemetry" },
      "retention_days": { "type": "integer", "default": 90 }
    }
  }
}
```

---

## 3. Google GenAI SDK & Vertex AI Agent Builder Interoperability

ModelForge provides native function declarations and extension specifications for Google's agentic ecosystem:

### Google GenAI SDK (`google.genai`)

```python
from google import genai
from google.genai import types
from modelforge.google_genai_agent import get_genai_function_declarations, dispatch_genai_tool_call

client = genai.Client()

# Bind ModelForge tools directly to Gemini 2.0 Flash / Pro
tools = [types.Tool(function_declarations=get_genai_function_declarations())]
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Calculate optimal TPU v6e Trillium slice topology for Gemma-2-27B with 16k context",
    config=types.GenerateContentConfig(tools=tools)
)

# Dispatch agent function call
if response.function_calls:
    for call in response.function_calls:
        tool_output = dispatch_genai_tool_call(call.name, call.args)
        print(f"ModelForge Tool Output: {tool_output}")
```

### Vertex AI Agent Builder Extensions

Export OpenAPI 3.0.3 specification for Vertex Extensions:

```python
from modelforge.google_genai_agent import export_vertex_extension_spec

spec = export_vertex_extension_spec()
# Import directly into GCP Console > Vertex AI > Agent Builder > Extensions
```

---

## 4. Recommended Agent Workflows

### Scenario A: Sizing an LLM for Production Deployment

1. Agent receives request: _"Deploy DeepSeek-R1-Distill-Qwen-32B for a customer support bot with 500ms TTFT"_.
2. Agent queries `get_compute_passport(model_id="deepseek-ai/DeepSeek-R1-Distill-Qwen-32B")`.
3. Agent checks memory requirements: minimum 24GB VRAM for FP8, recommended 48GB (L40S or A100).
4. Agent invokes `compile_slo(...)` with `task_type="rag"`, `max_p95_ttft_ms=500`.
5. Agent outputs `dynamo-config.yaml` or `docker-compose.yaml` with zero hallucinated parameters.

### Scenario B: CI Performance Guardrails

1. When submitting PRs that upgrade model weights, quantized engines, or vLLM versions:
2. Run `modelforge ci check --config .modelforge.yml`.
3. Detects if throughput drops > 5% or P95 TTFT increases > 10%.

---

## 5. REST API Quick Reference

| Endpoint                                | Method | Description                                   |
| --------------------------------------- | ------ | --------------------------------------------- |
| `/api/v1/models/{org}/{model}/passport` | `GET`  | Get revision-specific compute passport        |
| `/api/v1/plans`                         | `POST` | Compile workload and SLO into deployment plan |
| `/api/v1/slo/compile`                   | `POST` | Direct SLO compiler endpoint                  |
| `/api/v1/software-lift`                 | `GET`  | Query software lift metrics across runtimes   |
| `/api/v1/benchmarks/{id}/reproduce`     | `POST` | Verify empirical benchmark reproduction       |

---

## 6. Provenance Principles for AI Agents

When conveying performance figures to users, AI agents **MUST** distinguish evidence provenance:

- **`MEASURED`**: Empirical data from verifiable multi-run GPU execution.
- **`DOCUMENTED`**: Vendor official documentation or engineering whitepapers.
- **`DERIVED`**: Computed from mathematical memory models and roofline formulas.
- **`PREDICTED`**: Regression-estimated from adjacent parameter architectures.
- **`UNKNOWN`**: Unvalidated configuration.
