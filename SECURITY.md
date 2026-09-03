# Security Policy

ModelForge takes security, multi-tenant isolation, and benchmark cryptographic integrity seriously.

## Supported Versions

| Version | Supported          | Security Patches |
| ------- | ------------------ | ---------------- |
| 1.0.x   | :white_check_mark: | Active           |
| < 1.0   | :x:                | Deprecated       |

## Reporting a Vulnerability

If you discover a security vulnerability or sensitive data leak in ModelForge, please do **NOT** open a public GitHub issue.

Instead, please send a detailed report via encrypted email to:
**security@modelforge.dev**

Include:

1. Vulnerability description and impact.
2. Steps to reproduce or proof-of-concept script.
3. Affected components (e.g. CLI, Web, MCP Server, or API routes).
4. Any proposed remediations.

We will acknowledge receipt of your vulnerability report within **48 hours** and provide regular status updates until the issue is resolved and coordinated public disclosure is arranged.

## Security Boundaries & Guarantees

1. **Cryptographic Hashes (`environment_hash` & `result_hash`)**:
   Every OpenComputeBench observation computes SHA-256 digests over hardware telemetry and inference latency distributions. Tampered benchmarks fail verification and are rejected.
2. **Workload Privacy**:
   ModelForge compiles SLO plans using mathematical distributions (mean prompt length, output length, concurrency) without retaining or transmitting raw customer prompt text or confidential model weights.
3. **No Secret Leakage**:
   Health endpoints, public status checks, and client telemetry strictly redact API tokens (`NGC_API_KEY`, `HF_TOKEN`, `MODELFORGE_API_KEY`) and database credentials.
4. **Row Level Security (RLS)**:
   Multi-tenant databases enforce PostgreSQL RLS policies with `SECURITY DEFINER` validation.
