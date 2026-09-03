# ModelForge Roadmap

## Completed Milestones

### Phase 1: Foundation (v0.1.0)
- [x] Turborepo monorepo setup with pnpm and Python CLI
- [x] OpenComputeBench Zod schema and deterministic cryptographic hashing
- [x] Static hardware catalog (H100, L40S, RTX 4090, MI300X, M3 Ultra)
- [x] Initial PostgreSQL database migration and in-memory test store

### Phase 2: Deployment Intelligence Layer (v0.2.0)
- [x] Revision-specific Compute Passports
- [x] Workload ModelFit scoring engine
- [x] Inference SLO Compiler with Pareto multi-objective optimization
- [x] NVIDIA Dynamo disaggregated serving and NVIDIA NIM integration
- [x] Software Lift multipliers on identical hardware
- [x] Performance CI regression harness (`modelforge ci`)

### Phase 3: Evidence, Distribution & Public Launch (v1.0.0)
- [x] OpenComputeBench v1.0 Public Dataset under CDLA-Permissive-2.0
- [x] Formal Deterministic Confidence Engine v1.0.0
- [x] Full Model Context Protocol (MCP) stdio server with 9 v1 tools
- [x] CLI `--version`, `hardware inspect`, dynamic `plan`, `deploy-plan`, and `reproduce`
- [x] Public `/status`, `/support` matrix, and `/failures` corpus
- [x] OpenAPI 3.1.0 specification and official TypeScript / Python SDKs
- [x] Hugging Face Space dynamic calculations and standalone deployment

---

## Future Roadmap: Phase 4 & Beyond

### Q2 2025: Next-Generation Silicon & Distributed Inference
- [ ] **NVIDIA Blackwell Architecture Support**: Native B200 and GB200 NVL72 benchmark profiles, FP4 Tensor Core scaling, and NVLink 5 switch telemetry.
- [ ] **Multi-Node Distributed Benchmark Harness**: Automated inter-node bandwidth, InfiniBand NDR, and RoCE latency profiling across multi-node Dynamo topologies.
- [ ] **Automated Speculative Decoding Profiler**: Empirical acceptance rate benchmarks across draft-target model pairs on production serving engines.

### Q3 2025: Extended Ecosystem & Autonomous Agents
- [ ] **Expanded Accelerator Targets**: Deep support for Intel Gaudi 3, AWS Inferentia 2, and Tenstorrent Wormhole.
- [ ] **Continuous Hugging Face Hub Webhook Sync**: Real-time Compute Passport generation triggered on new model commit events.
- [ ] **Decentralized Benchmark Network**: Cryptographically verified remote worker network with proof-of-execution validation.
