# ModelForge: Hugging Face Ecosystem Launch Brief

**Empowering Model Creators & Deployers with Verifiable Compute Intelligence**

---

## The Vision for Hugging Face Creators

Model maintainers on Hugging Face train and publish extraordinary weights, but model cards routinely lack actionable deployment intelligence. End users are left asking:
- *Can my team run this model on a single 24GB GPU or do we need multiple 80GB enterprise GPUs?*
- *What is the actual tokens/second throughput and TTFT latency across serving engines?*
- *Has this model been reproduced by independent third parties?*

ModelForge provides **Compute Passports**, **Interactive Hugging Face Spaces**, and **Dynamic Markdown Badges** directly integrated with the Hugging Face Hub.

---

## 1. Exact Revision Commit SHA Tracking
ModelForge anchors every benchmark observation and Compute Passport to an **exact git commit SHA** on the Hugging Face Hub. Model architectures and tokenizer configs evolve; tracking `main` is insufficient. ModelForge guarantees that performance telemetry reflects the exact artifact being downloaded.

---

## 2. Dynamic Model Card Badges
Model maintainers can copy and paste verified badges into their `README.md` model cards:

```markdown
<!-- ModelForge Badges -->
[![Compute Passport](https://img.shields.io/badge/Compute%20Passport-Verified-blue)](https://modelforge.dev/models/Qwen/Qwen2.5-32B-Instruct/passport)
[![Benchmark Coverage](https://img.shields.io/badge/OpenComputeBench-Covered-indigo)](https://modelforge.dev/benchmarks?model=Qwen%2FQwen2.5-32B-Instruct)
[![ModelFit Score](https://img.shields.io/badge/ModelFit-94%2F100%20(A%2B)-brightgreen)](https://modelforge.dev/model-fit?model=Qwen%2FQwen2.5-32B-Instruct)
[![Performance CI](https://img.shields.io/badge/Performance%20CI-Passing-brightgreen)](https://modelforge.dev/models/Qwen/Qwen2.5-32B-Instruct/ci)
[![Reproduced 8x](https://img.shields.io/badge/Reproduced-8x%20Verified-blueviolet)](https://modelforge.dev/benchmarks?model=Qwen%2FQwen2.5-32B-Instruct&verifiedOnly=true)
```

Generated instantly via:
```bash
modelforge badge <organization/model-id>
```

---

## 3. OpenComputeBench v1.0 Public Dataset
Released directly under the **CDLA-Permissive-2.0** license:
- Available in JSON Lines (`.jsonl`) with standardized schemas.
- Complete cryptographic environment and result hashes (`sha256`) to prevent spoofing.
- Public benchmark reproduction logging allowing community members to submit reproduction runs.

---

## 4. Interactive Hugging Face Space
The official ModelForge Space (`apps/hf-space`) operates as a zero-dependency standalone Gradio app featuring:
- **Compute Passport Explorer**: Real-time memory footprint calculation across precisions (FP16, FP8, INT4).
- **Inference SLO Compiler**: Dynamic calculation of GPU requirements, latency, and cost per 1M tokens.
- **Software Lift Multipliers**: Comparing PyTorch vs. vLLM, TensorRT-LLM, and NVIDIA Dynamo.
- **Deployment Failure Corpus**: Cataloging OOM boundaries and driver incompatibilities.
