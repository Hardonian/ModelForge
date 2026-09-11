# ModelForge Agent Integration & Tool Ecosystem

> **Audience:** Autonomous Coding Agents, IDE Extensions, AI Infrastructure Assistants

---

## 1. Overview

ModelForge provides structured, tool-calling APIs designed specifically for AI agents (Cursor, Windsurf, Claude Code, Antigravity, Devin).

Instead of relying on LLM training weights to hallucinate whether an 8-bit model will fit on an RTX 4090 or what tensor parallel size to select for Llama-3.3-70B on 4x H100s, agents query ModelForge MCP tools.

---

## 2. MCP Tools Available

- `get_compute_passport(model_id, revision)`: Return verified memory limits and compatibility.
- `compile_slo(model_id, workload, slo)`: Generate ranked deployment topologies and manifests.
- `get_google_tpu_topology(model_id, tpu_generation, context_length)`: Calculate optimal TPU v5e/v5p/v6e slice dimensions and ICI interconnect.
- `export_vertex_manifest(model_id, accelerator_type, accelerator_count)`: Generate deployable Google Cloud Vertex AI endpoint specification.
- `apply_hot_patch_action(deployment_id, patch_type, target_precision)`: Execute live zero-downtime hot-patch with rollback token.
- `export_bigquery_telemetry_schema(dataset_id, retention_days)`: Return BigQuery telemetry DDL and analytical views.
- `generate_dynamo_plan(model_id, workload)`: Generate Kubernetes CRD for NVIDIA Dynamo disaggregated serving.
- `generate_nim_plan(model_id)`: Generate Docker Compose for NVIDIA NIM container.
- `get_software_lift(model_id, accelerator)`: Query empirical throughput multipliers across runtimes.

---

## 3. Google GenAI SDK & Python SDK Usage

### Google GenAI SDK (`google.genai`)

```python
from google import genai
from google.genai import types
from modelforge.google_genai_agent import get_genai_function_declarations, dispatch_genai_tool_call

client = genai.Client()
tools = [types.Tool(function_declarations=get_genai_function_declarations())]

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Calculate optimal TPU v6e Trillium slice topology for Gemma-2-27B",
    config=types.GenerateContentConfig(tools=tools)
)

if response.function_calls:
    for call in response.function_calls:
        output = dispatch_genai_tool_call(call.name, call.args)
        print(output)
```

### Python SDK Usage

```python
from modelforge.schema import OpenComputeBenchRecord
from modelforge.passport import KNOWN_PASSPORTS

# Query passport
passport = KNOWN_PASSPORTS.get("qwen/qwen2.5-32b-instruct")
print(f"FP8 Weight VRAM: {passport['memory']['fp8']}")
print(f"Confidence: {passport['confidence']}/100")
```

---

## 4. REST Endpoints for Agents

All ModelForge REST endpoints return clean JSON adhering to strict Zod and Pydantic schemas:

- `GET /api/v1/models/{model}/passport`
- `POST /api/v1/plans`
- `POST /api/v1/slo/compile`
- `GET /api/v1/software-lift`
- `GET /api/v1/hardware`
- `GET /api/v1/control/google-cloud`
- `POST /api/v1/control/hot-patch`
