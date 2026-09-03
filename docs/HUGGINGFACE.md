# Hugging Face Integration & Deployment Guide

## Hugging Face Spaces

ModelForge includes an independently deployable public Space located in `apps/hf-space`. Built with Gradio, it allows any user to evaluate ModelFit, run the Workload Optimizer, and browse OpenComputeBench without leaving the Hugging Face ecosystem.

### Deploying to Hugging Face Space

1. Create a new Space on [Hugging Face](https://huggingface.co/new-space) with the **Gradio** SDK.
2. Clone your Space repository:
   ```bash
   git clone https://huggingface.co/spaces/YOUR_ORG/modelforge
   ```
3. Copy the contents of `apps/hf-space/*` into your Space repository:
   ```bash
   cp -r apps/hf-space/* ./modelforge/
   cd modelforge
   git add .
   git commit -m "Deploy ModelForge Space"
   git push origin main
   ```
4. The Space will automatically build and launch within 60 seconds.

## Hugging Face Datasets Sync

The OpenComputeBench benchmark observations are serialized to Parquet and published to the `modelforge/opencomputebench` dataset on the Hugging Face Hub.
```python
from datasets import load_dataset

dataset = load_dataset("modelforge/opencomputebench")
print(dataset["train"].to_pandas())
```
