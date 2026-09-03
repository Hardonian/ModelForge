# Known Limitations & Boundary Conditions

ModelForge strives for absolute technical honesty. To help engineering teams make sound architectural decisions, this document explicitly details current operational limitations of ModelForge v1.0.0.

## 1. Single-Node vs. Multi-Node Automated Benchmarking

- **Supported**: Automated local benchmarking via `modelforge benchmark` currently operates within a single machine / cluster node.
- **Topology Plans**: Multi-node disaggregated architectures (e.g. NVIDIA Dynamo multi-node prefill/decode clusters) can be planned and generated, but executing benchmarks across distributed InfiniBand clusters currently requires external harness orchestration.

## 2. Hardware Simulation Boundaries

- When running in `--simulate` mode on non-GPU hardware, benchmark results are derived from deterministic analytical roofline models.
- **Rule**: Simulated benchmarks are explicitly marked with `synthetic_fixture: true` and are excluded from canonical production deployment recommendations.

## 3. Quantization Degradation Bounds

- While ModelForge tracks quality retention (e.g. MMLU-Pro or GSM8k retention scores) for quantized checkpoints, actual task performance on custom domain datasets must be validated by the application maintainer.

## 4. Upstream Runtime Volatility

- Inference serving engines (such as vLLM and TensorRT-LLM) release frequent updates. A benchmark verified against vLLM v0.6.4 may show slight throughput deviations on subsequent point releases due to upstream kernel changes.

## 5. Token Length Boundaries

- Context lengths beyond 131,072 tokens are subject to hardware KV-cache memory limits. For ultra-long context workloads, chunked prefill or disaggregated KV cache routing is required.
