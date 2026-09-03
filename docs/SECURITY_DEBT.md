# MODELForge Security Debt & Residual Risk Register

## 1. Overview & Policy

This document registers known residual security risks, their operational mitigations, and required deployment controls for the ModelForge production release. Every item documented here has been evaluated by the engineering team and determined to be non-blocking for launch when configured according to production runbooks.

---

## 2. Residual Risk Register

| Risk ID | Component | Severity | Description | Compensating Control & Operational Requirement |
| :--- | :--- | :---: | :--- | :--- |
| **SEC-01** | Local Memory Data Layer | Low | When PostgreSQL is unconfigured (e.g. CLI local profiling), ModelForge uses an in-memory repository without multi-tenant RLS. | Production deployment environments MUST provide `DATABASE_URL` pointing to hardened PostgreSQL with RLS enabled. |
| **SEC-02** | Kubernetes Adapter Privilege | Medium | Production Kubernetes provider adapter requires permission to create Deployments and mutate Service endpoints. | ServiceAccount MUST be scoped strictly to the target serving namespace via Namespaced Role/RoleBinding. Cluster-admin is prohibited. |
| **SEC-03** | Third-Party Hugging Face Hub | Low | Upstream Hugging Face API rate limits or downtime can delay model metadata lookups. | ModelForge caches canonical architecture dimensions and rejects `trust_remote_code=True` by default. |
| **SEC-04** | Outbound Webhook Delivery | Low | Outbound webhook endpoints may fail during customer network partitions. | Delivery engine implements HMAC-SHA256 signature stamping and exponential backoff retry capped at 24 hours. |
| **SEC-05** | Community Benchmark Trust | Medium | An adversarial community worker could attempt to report false throughput metrics. | Outlier filtering and trust weighting ensure recommendations require multiple verified reproductions before impacting production baselines. |

---

## 3. Operational Requirements for Production Launch

1. **Environment Isolation**: Production instances must run with `NODE_ENV=production` and validated environment secrets.
2. **Strict TLS 1.3**: All public ingress must terminate TLS 1.3 with HSTS (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).
3. **Secret Store Integration**: Cloud credentials, Stripe private keys, and Hugging Face tokens must be mounted from dedicated KMS/Vault stores and never committed to source control.
