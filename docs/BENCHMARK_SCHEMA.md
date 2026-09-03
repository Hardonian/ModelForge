# OpenComputeBench Schema Specification (v1.0.0)

## JSON Schema Specification

The OpenComputeBench specification standardizes inference telemetry into an immutable, deterministically hashable document.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "OpenComputeBenchRecord",
  "type": "object",
  "required": [
    "benchmark_id",
    "schema_version",
    "model",
    "runtime",
    "precision",
    "hardware",
    "software",
    "workload",
    "metrics",
    "provenance",
    "verification"
  ],
  "properties": {
    "benchmark_id": { "type": "string", "format": "uuid" },
    "schema_version": { "type": "string", "const": "1.0.0" },
    "synthetic_fixture": { "type": "boolean", "default": false },
    "model": {
      "type": "object",
      "required": [
        "provider",
        "repository",
        "revision",
        "architecture",
        "parameters_billions"
      ],
      "properties": {
        "provider": { "type": "string" },
        "repository": { "type": "string" },
        "revision": { "type": "string" },
        "architecture": { "type": "string" },
        "parameters_billions": { "type": "number" },
        "context_window": { "type": "integer" }
      }
    },
    "runtime": {
      "type": "object",
      "required": ["name", "version"],
      "properties": {
        "name": {
          "type": "string",
          "enum": [
            "vllm",
            "tensorrt-llm",
            "llama.cpp",
            "sglang",
            "tgi",
            "transformers",
            "simulation"
          ]
        },
        "version": { "type": "string" },
        "engine_args": { "type": "object" }
      }
    },
    "precision": {
      "type": "object",
      "required": ["type"],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "fp32",
            "tf32",
            "fp16",
            "bf16",
            "fp8",
            "int8",
            "int4",
            "awq",
            "gptq"
          ]
        },
        "quantization_method": { "type": "string" }
      }
    },
    "hardware": {
      "type": "object",
      "required": [
        "vendor",
        "device",
        "count",
        "vram_bytes_per_device",
        "total_vram_bytes",
        "interconnect"
      ],
      "properties": {
        "vendor": {
          "type": "string",
          "enum": ["nvidia", "amd", "apple", "intel", "cpu", "other"]
        },
        "device": { "type": "string" },
        "count": { "type": "integer", "minimum": 1 },
        "vram_bytes_per_device": { "type": "integer" },
        "total_vram_bytes": { "type": "integer" },
        "interconnect": { "type": "string" }
      }
    },
    "provenance": {
      "type": "object",
      "required": [
        "submitted_by",
        "runner_version",
        "started_at",
        "completed_at",
        "environment_hash",
        "result_hash"
      ],
      "properties": {
        "environment_hash": {
          "type": "string",
          "minLength": 64,
          "maxLength": 64
        },
        "result_hash": { "type": "string", "minLength": 64, "maxLength": 64 }
      }
    }
  }
}
```

## Deterministic Hashes

- `environment_hash`: SHA-256 digest of canonical JSON `{hardware, software, runtime}`.
- `result_hash`: SHA-256 digest of canonical JSON `{model, precision, workload, metrics}`.
