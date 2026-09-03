# Changelog

All notable changes to the ModelForge project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-02-01 — Official Public Launch

### Added

- **OpenComputeBench v1.0 Public Dataset**: Released under CDLA-Permissive-2.0 with cryptographic verification hashes (`environment_hash`, `result_hash`) and Golden Benchmark status.
- **Deterministic Confidence Engine v1.0.0**: Formalized, versioned evidence confidence calculation algorithm scoring revision match, sample volume, reproduction count, hardware match, and variance.
- **Model Context Protocol (MCP) Server**: Full JSON-RPC 2.0 stdio server (`modelforge mcp`) exposing 9 v1 tools for Cursor, Windsurf, Claude Code, and autonomous AI coding agents.
- **CLI Subcommands & Features**:
  - `modelforge --version` flag returning `1.0.0`.
  - `modelforge hardware inspect` with `--json` option separating manufacturer nominal specs from observed telemetry.
  - `modelforge reproduce` with tolerance checking, delta calculation, and linked reproduction tracking.
  - `modelforge plan` and `modelforge deploy-plan` with dynamic hardware sizing and validated manifest outputs (`docker-compose.yaml`, `dynamo-config.yaml`, `run-vllm.sh`).
  - `modelforge badge` supporting 5 distinct markdown badges (`passport`, `coverage`, `modelfit`, `ci`, `reproduced`).
- **Web Application Endpoints & Pages**:
  - System Operational Status dashboard (`/status`) and `/api/health` endpoint.
  - Architecture Support Matrix page (`/support`) and machine-readable `/api/v1/support-matrix`.
  - Deployment Failure Corpus (`/failures`) and `/api/v1/failures` endpoint.
- **Official Client SDKs**:
  - Python SDK (`ModelForgeClient`) in `packages/benchmark-cli/modelforge/client.py`.
  - TypeScript SDK (`ModelForgeClient`) in `packages/api-client`.
- **OpenAPI 3.1.0 Specification**: Formal machine-readable contract at `docs/openapi.json`.
- **Governance & Legal Documentation**: `NOTICE`, `TRADEMARKS.md`, `SECURITY.md`, `GOVERNANCE.md`, `ROADMAP.md`, `PRIVACY.md`, `KNOWN_LIMITATIONS.md`.

### Changed

- Upgraded Hugging Face Space (`apps/hf-space/app.py`) with dynamic SLO compilation, failure corpus filters, and strict typing.
- Hardened database schema and migration SQL with `SECURITY DEFINER` RLS policy validation.

## [0.2.0] - 2025-01-15 — Phase 2: Deployment Intelligence Layer

### Added

- Compute Passports tracking exact Hugging Face model revisions.
- Workload ModelFit scoring across memory, performance, runtime, context, and efficiency.
- Inference SLO Compiler with support for NVIDIA Dynamo disaggregated serving and NVIDIA NIM.
- Software Lift multipliers documenting speedup on identical hardware.
- Performance CI regression detection (`modelforge ci check`).

## [0.1.0] - 2025-01-01 — Phase 1: Core Foundation

### Added

- Monorepo infrastructure with Turborepo, pnpm, Next.js, and Python Typer CLI.
- OpenComputeBench JSON schema and deterministic hash calculation.
- Hardware registry catalog (H100, L40S, RTX 4090, MI300X, M3 Ultra).
- Basic database schema and Supabase migrations.
