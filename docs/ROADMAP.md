# Strategic Product & Engineering Roadmap

## Phase 1: Foundation & Open Groundwork (Current)
- [x] Versioned OpenComputeBench schema (`schema_version: "1.0.0"`).
- [x] Multi-vendor hardware registry (NVIDIA, AMD, Apple Silicon, Intel, CPU).
- [x] Model intelligence catalog with parameter counts & context windows.
- [x] Explainable ModelFit composite 0–100 scoring engine with 6 sub-scores.
- [x] Python 3.12+ CLI agent (`modelforge`) with hardware inspection, warmup/measured phases, and `doctor` command.
- [x] Standalone Hugging Face Space with Gradio.
- [x] Next.js 15 web platform (Explore, Catalog, Optimizer, ModelFit, Leaderboards, Console).
- [x] PostgreSQL multi-tenant database schema with Row Level Security (RLS).

## Phase 2: Runtime Adapters & Distributed Submissions
- [ ] Direct C++/Python bindings for vLLM, SGLang, and TensorRT-LLM in CLI.
- [ ] Automated attestation tokens for verifying physical GPU telemetry.
- [ ] Automated Hugging Face Hub Dataset bi-directional synchronization.
- [ ] Dynamic SVG and WebP Open Graph social benchmark cards.

## Phase 3: Commercial SaaS & Enterprise Fleets
- [ ] Stripe customer portal live webhooks and automated entitlement sync.
- [ ] Private VPC benchmark worker agents with secure mTLS egress.
- [ ] Multi-cloud provider real-time pricing feeds (AWS, GCP, Azure, RunPod, Lambda, CoreWeave).
- [ ] Custom SLA monitors and real-time workload drift alerting.

## Phase 4: Machine Learned Performance Prediction
- [ ] Graph neural network (GNN) performance predictor trained on OpenComputeBench graph.
- [ ] Automated kernel tuning parameter discovery.
- [ ] Continuous inference FinOps autopilot for autoscaling clusters.

## Phase 5: Ecosystem & Autonomous Deployment
- [ ] Helm chart and Kubernetes Operator (`modelforge-operator`).
- [ ] Native LangChain, LlamaIndex, and vLLM provider integrations.
- [ ] Cross-cloud automated spot instance failover engine.
