# ModelForge Project Governance

ModelForge is an open source initiative dedicated to building the open deployment intelligence layer between Hugging Face models and production AI compute.

## Principles

1. **Empirical Primacy**: Technical claims must be grounded in reproducible benchmarks with verifiable cryptographic provenance.
2. **Vendor Neutrality**: Optimization decisions are multi-objective and mathematically solved without artificial bias toward specific hardware vendors or software stacks.
3. **Open Access**: Benchmark schemas, dataset releases, and CLI runners remain permissively licensed (Apache-2.0 / CDLA-Permissive-2.0).

## Maintainers & Roles

- **Core Maintainers**: Responsible for repository stewardship, architecture decisions, release reviews, and security triage.
- **Reviewers**: Domain experts reviewing pull requests across schema integrity, hardware registry, runtime integrations, and web services.
- **Contributors**: Community members submitting bug fixes, benchmark observations, hardware profiles, and runtime adapters.

## Request for Comments (RFC) Process

Substantial architectural changes or additions to the OpenComputeBench specification must follow the RFC process:

1. Open an issue with the prefix `[RFC]` detailing the problem, technical proposal, alternatives considered, and backward compatibility impact.
2. Maintainers and community members review and comment during a minimum 14-day discussion window.
3. Consensus is reached through technical merit and alignment with project principles.

## Release Cadence

- **Patch Releases (1.0.x)**: Shipped as needed for critical bug fixes, schema validation updates, or security patches.
- **Minor Releases (1.x.0)**: Shipped monthly with new hardware profiles, runtime adapters, and performance improvements.
- **Major Releases (x.0.0)**: Reserved for backward-incompatible schema revisions, subject to formal RFC approval.
