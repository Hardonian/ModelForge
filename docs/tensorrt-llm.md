# TensorRT-LLM Integration & Hardware Optimization

> **Runtime:** TensorRT-LLM (`tensorrt_llm`)  
> **Target Accelerators:** NVIDIA Hopper (H100, H200), Ada Lovelace (L40S, RTX 4090), Blackwell (B200)

---

## 1. Overview

TensorRT-LLM provides NVIDIA's lowest latency and highest throughput inference execution engine. It compiles neural network graphs with fused multi-head attention (FMHA), in-flight batching, FP8 / NVFP4 quantization kernels, and custom CUDA tensor operations.

ModelForge models TensorRT-LLM performance mathematically and empirically:

- **Hopper Transformer Engine:** Models FP8 GEMM acceleration and native hardware FP8 tensor cores.
- **In-Flight Batching (IFB):** Dynamically inserts new request tokens into active batch iteration loops without padding overhead.
- **Paged KV Cache:** Allocates non-contiguous memory blocks for attention caches, eliminating fragmentation.

---

## 2. ModelForge Build Profile

When generating TensorRT-LLM configurations, ModelForge produces optimized engine build flags:

```bash
# Sizing command for Hopper H100 FP8
trtllm-build \
  --checkpoint_dir /models/Qwen2.5-32B-FP8 \
  --output_dir /engines/qwen-32b-hopper \
  --gemm_plugin fp8 \
  --gpt_attention_plugin fp8 \
  --paged_kv_cache enable \
  --remove_input_padding enable \
  --tokens_per_block 64 \
  --max_batch_size 64 \
  --max_input_len 8192 \
  --max_seq_len 16384
```

---

## 3. Disaggregated Serving with Dynamo

ModelForge couples TensorRT-LLM with NVIDIA Dynamo:

- Dynamo handles disaggregated prefill/decode routing and inter-node KV cache distribution.
- TensorRT-LLM executes the optimized kernel engine inside each Dynamo worker pod.
- Result: **+2.71x Software Lift** over standard Transformers on H100.
