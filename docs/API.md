# ModelForge REST API Reference (v1)

Base URL: `https://modelforge.dev/api/v1` (or `http://localhost:3000/api/v1`)

## Authentication

Requests to authenticated endpoints require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer mf_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Endpoints

### 1. List Benchmarks

`GET /api/v1/benchmarks`

Query Parameters:

- `model`: Filter by model repository (e.g. `Qwen`).
- `hardware`: Filter by accelerator device (e.g. `L40S`).
- `runtime`: Filter by runtime engine (`vllm`, `llama.cpp`, `tensorrt-llm`).
- `precision`: Filter by precision format (`fp8`, `fp16`, `int4`).

Response: `200 OK` array of `OpenComputeBenchRecord`.

---

### 2. Get Benchmark

`GET /api/v1/benchmarks/:id`

Response: `200 OK` single `OpenComputeBenchRecord` or `404 Not Found`.

---

### 3. Submit Benchmark

`POST /api/v1/benchmark-submissions`

Payload: Complete `OpenComputeBenchRecord` with valid `environment_hash` and `result_hash`.

Response:

```json
{
  "status": "accepted",
  "benchmark_id": "a1b2c3d4-...",
  "verification_status": "community",
  "url": "https://modelforge.dev/benchmarks/a1b2c3d4-..."
}
```

---

### 4. Calculate ModelFit

`POST /api/v1/model-fit`

Payload:

```json
{
  "model": {
    "id": "Qwen/Qwen2.5-32B-Instruct",
    "parameters_billions": 32.5,
    "context_window": 131072,
    "layers": 64,
    "kv_heads": 8,
    "head_dim": 128
  },
  "hardware": {
    "device_slug": "l40s-48gb",
    "device_count": 1
  },
  "runtime": { "name": "vllm", "version": "0.6.4" },
  "precision": "fp8",
  "workload": { "context_length": 4096, "concurrency": 2 }
}
```

Response: `200 OK` with composite score, 6 sub-scores, and memory waterfall.

---

### 5. Workload Optimizer

`POST /api/v1/optimizer`

Payload:

```json
{
  "model": {
    "id": "Qwen/Qwen2.5-32B-Instruct",
    "parameters_billions": 32.5,
    "context_window": 131072,
    "layers": 64,
    "kv_heads": 8,
    "head_dim": 128
  },
  "workload": {
    "context_length": 4096,
    "concurrency": 4,
    "expected_requests_per_day": 50000
  },
  "objective": "lowest_cost"
}
```

Response: `200 OK` with Pareto-ranked candidate configurations and generated Docker/Kubernetes manifests.
