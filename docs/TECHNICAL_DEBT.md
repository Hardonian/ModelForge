# MODELForge Technical Debt Register

## 1. Governance & Ranking Policy

Technical debt is categorized and prioritized according to operational impact and architectural maintainability:

- **HIGH**: Architecture defects or limitations that impact scalability or require imminent refactoring. Zero high-severity items exist that block release.
- **MEDIUM**: Non-blocking architectural enhancements scheduled for post-v1.0 minor releases.
- **LOW**: Minor code polish, aesthetic refinements, or developer convenience tooling.

---

## 2. Technical Debt Backlog

### Medium Priority

1. **TD-MED-01: Real-time Telemetry Push via WebSockets / SSE**
   - *Current State*: The operator dashboard polls live canary telemetry at 5-second intervals via `GET /api/v1/control/actions/[id]`.
   - *Target State*: Integrate Server-Sent Events (SSE) for sub-second telemetry streaming during active canaries.
   - *Impact*: Negligible at current scale; recommended for clusters with >100 concurrent canaries.

2. **TD-MED-02: Multi-Cluster Kubernetes Federation**
   - *Current State*: `KubernetesExecutionProvider` targets a designated cluster endpoint per deployment configuration.
   - *Target State*: Native support for multi-cluster global load balancer (GSLB) traffic splitting across disparate cloud providers.
   - *Impact*: Deployments requiring cross-cloud failover currently manage ingress routing via external DNS.

### Low Priority

1. **TD-LOW-01: Automated Benchmark Dataset Aging & Pruning**
   - *Current State*: Benchmark records are marked `STALE` after 180 days by `evaluateFreshness()`, but retained indefinitely in storage.
   - *Target State*: Configurable automated archival to cold S3/GCS storage for benchmarks older than 365 days.
   - *Impact*: Minimal storage overhead at present dataset volume (<50 MB).

2. **TD-LOW-02: Enhanced CLI Shell Auto-Completion**
   - *Current State*: Typer CLI subcommands have help messages and options; auto-completion scripts are optional.
   - *Target State*: Packaged bash/zsh/fish completion scripts bundled with pip package distribution.
   - *Impact*: Pure developer ergonomics.
