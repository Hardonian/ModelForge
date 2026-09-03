# Commercial SaaS Architecture & FinOps Engine

## Overview

ModelForge is engineered as a venture-scale infrastructure company combining an open-source data flywheel with high-margin enterprise software.

## Monetization Architecture

```
                               ┌────────────────────────┐
                               │  Open Community Layer  │
                               │  (CLI + Public Graph)  │
                               └───────────┬────────────┘
                                           │
                                           ▼
                               ┌────────────────────────┐
                               │  ModelForge SaaS Core  │
                               │  (Multi-Tenant Cloud)  │
                               └───────────┬────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
            Self-Serve Tier (Pro/Team)             Enterprise FinOps Layer
            - Stripe Subscriptions                 - VPC Isolated Runners
            - API Quotas                           - Fleet Autopilot
            - Private Benchmarks                   - Custom Hardware Profiling
```

### 1. Entitlements & Pricing Strategy

- **Free**: Community acquisition engine. Fosters benchmark contributions and cements ModelFit as the industry-standard compatibility metric.
- **Pro ($49/mo)**: Targeted at individual AI engineers and early startups deploying 1–3 models. Unlocks saved workloads, API access, and manifest export.
- **Team ($299/mo)**: Targeted at mid-market AI engineering teams. Enables multi-seat organizations, private benchmarks, team API keys, and RBAC.
- **Enterprise (Custom)**: Large clusters and hyperscalers. Deploys private benchmark runners inside customer AWS/GCP VPCs to benchmark proprietary fine-tuned weights without data egress.

### 2. Stripe Integration Boundary

- Server-side only via Node runtime webhook handler (`/api/v1/webhooks/stripe`).
- Strictly verifies HMAC-SHA256 signature against `STRIPE_WEBHOOK_SECRET`.
- Employs an idempotent event processing table to protect against duplicate webhook retries.
- Client bundles never contain Stripe secret keys.
