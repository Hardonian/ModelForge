# Security Architecture & Tenant Isolation

## Threat Model & Invariants

ModelForge executes inference benchmarks and manages enterprise workload topologies. The system treats all user inputs, uploaded benchmark payloads, and model identifiers as untrusted.

### 1. Multi-Tenant Data Isolation (Row Level Security)

- All tenant-owned tables (`workloads`, `projects`, `api_keys`, private `benchmarks`) enforce PostgreSQL Row Level Security (RLS).
- A user can never read, modify, or leak another organization's workloads or private benchmarks.
- Public benchmark tables (`benchmarks` where `is_private = false`) are explicitly bifurcated from private customer runs.

### 2. API Key Management

- API keys are issued with a standardized prefix (`mf_live_...` or `mf_test_...`).
- Secret keys are displayed to the user exactly once upon creation.
- The database stores **only** the cryptographic SHA-256 hash of the token:
  $$\text{Key Hash} = \text{SHA-256}(\text{Raw Key})$$
- Even in the event of a database compromise, plaintext API keys cannot be recovered.

### 3. Anti-Tampering & Benchmark Provenance

- Benchmark payloads submitted from remote agents are validated against the OpenComputeBench schema.
- The server independently recomputes `environment_hash` and `result_hash`. Any divergence results in an immediate `422 Unprocessable Entity` rejection.
- Synthetic development fixtures (`synthetic_fixture = true`) are blocked from ever receiving the `verified` status via strict database check constraints.

### 4. Runner Sandboxing & Command Injection Prevention

- The `modelforge` CLI never accepts arbitrary shell commands from network endpoints.
- Runtimes are invoked via structured process arguments rather than `shell=True`.
