# Hugging Face Integration & Deployment Pipeline

> **Pipeline:** Hugging Face Model & Revision &rarr; ModelForge Compute Passport &rarr; Deployment Plan &rarr; Production Infrastructure

---

## 1. Overview

ModelForge integrates directly with the Hugging Face Hub, Jobs infrastructure, and model repositories to convert static weights into production-ready deployments.

### Key Integration Points

1. **Repository & Revision Resolution:** Ingests `org/model` and exact commit SHAs (`org/model@revision`) directly from Hugging Face Hub metadata.
2. **Model Card Badges:** Generates dynamic markdown badges linking model cards to verified Compute Passports and ModelFit grades.
3. **Hugging Face Jobs:** Dispatches reproducible benchmark runs to remote Hugging Face Jobs instances via `--hf-job`.
4. **Hugging Face Spaces:** Deploys interactive Gradio discovery spaces for ModelFit scoring, SLO planning, and software lift exploration.
5. **Hugging Face Datasets:** Exports OpenComputeBench empirical records to Parquet and JSON datasets for public research.

---

## 2. Dispatching Hugging Face Jobs

```bash
# Execute remote benchmark on Hugging Face Jobs infrastructure
export HF_TOKEN=hf_your_token_here
modelforge benchmark Qwen/Qwen2.5-32B-Instruct --hf-job --precision fp8 --runtime vllm
```

The CLI:

- Validates `HF_TOKEN` credentials.
- Provisions compute instance matching target hardware.
- Pulls model weights and runs OpenComputeBench standardized workloads.
- Computes SHA-256 environment and result hashes.
- Uploads verified benchmark record to the ModelForge network.

---

## 3. Embedding Badges in Model READMEs

Add this block to your model card:

```markdown
<!-- ModelForge Compute Intelligence -->
[![ModelForge Compute Passport](https://img.shields.io/badge/Compute%20Passport-Verified-blue)](https://modelforge.dev/models/Qwen/Qwen2.5-32B-Instruct/passport)
[![ModelFit Score](https://img.shields.io/badge/ModelFit-96%2F100%20(A%2B)-brightgreen)](https://modelforge.dev/model-fit?model=Qwen%2FQwen2.5-32B-Instruct)
[![OpenComputeBench](https://img.shields.io/badge/OpenComputeBench-Reproduced-indigo)](https://modelforge.dev/benchmarks)
```
