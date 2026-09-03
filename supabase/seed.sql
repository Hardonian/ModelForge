-- ModelForge Deterministic Seed Data
-- Version: 1.0.0

-- Hardware Catalog Seeds
INSERT INTO hardware (
    id, slug, name, vendor, category, architecture, vram_bytes, memory_bandwidth_gb_s, 
    tdp_watts, fp16_tflops, bf16_tflops, fp8_tflops, int8_tops, interconnect, 
    supported_precisions, supported_runtimes, release_year, typical_cloud_cost_per_hour_usd
) VALUES 
(
    'nvidia-h100-sxm5-80gb', 'h100-sxm5-80gb', 'NVIDIA H100 SXM5 80GB', 'nvidia', 'datacenter', 'Hopper', 
    85899345920, 3350.00, 700, 990.00, 990.00, 1979.00, 1979.00, 'nvlink_4',
    ARRAY['fp16', 'bf16', 'fp8', 'int8', 'int4'], ARRAY['vllm', 'tensorrt-llm', 'sglang', 'tgi'], 2023, 3.2000
),
(
    'nvidia-l40s-48gb', 'l40s-48gb', 'NVIDIA L40S 48GB', 'nvidia', 'datacenter', 'Ada Lovelace', 
    51539607552, 864.00, 350, 366.00, 366.00, 733.00, 733.00, 'pcie_gen4',
    ARRAY['fp16', 'bf16', 'fp8', 'int8', 'int4'], ARRAY['vllm', 'tensorrt-llm', 'sglang', 'llama.cpp'], 2023, 1.1500
),
(
    'nvidia-rtx-4090-24gb', 'rtx-4090-24gb', 'NVIDIA GeForce RTX 4090 24GB', 'nvidia', 'consumer', 'Ada Lovelace', 
    25769803776, 1008.00, 450, 330.00, 330.00, 660.00, 660.00, 'pcie_gen4',
    ARRAY['fp16', 'bf16', 'fp8', 'int8', 'int4'], ARRAY['vllm', 'llama.cpp', 'sglang'], 2022, 0.7500
),
(
    'amd-instinct-mi300x-192gb', 'instinct-mi300x-192gb', 'AMD Instinct MI300X 192GB', 'amd', 'datacenter', 'CDNA 3', 
    206158430208, 5300.00, 750, 1307.00, 1307.00, 2614.00, 2614.00, 'infinity_fabric',
    ARRAY['fp16', 'bf16', 'fp8', 'int8', 'int4'], ARRAY['vllm', 'sglang', 'tgi'], 2024, 3.5000
),
(
    'apple-m3-ultra-192gb', 'apple-m3-ultra-192gb', 'Apple M3 Ultra 192GB', 'apple', 'soc', 'Apple Silicon M3', 
    206158430208, 800.00, 140, NULL, NULL, NULL, NULL, 'unified_memory',
    ARRAY['fp16', 'bf16', 'int8', 'int4'], ARRAY['llama.cpp', 'transformers'], 2024, NULL
)
ON CONFLICT (id) DO NOTHING;

-- Models Catalog Seeds
INSERT INTO models (
    id, provider, name, family, parameters_billions, architecture, context_window, 
    layers, kv_heads, head_dim, vocab_size, default_dtype, task, license, gated, downloads_monthly
) VALUES
(
    'Qwen/Qwen2.5-32B-Instruct', 'Qwen', 'Qwen 2.5 32B Instruct', 'Qwen2.5', 32.50, 'Qwen2ForCausalLM', 131072, 
    64, 8, 128, 152064, 'bfloat16', 'conversational', 'Apache-2.0', FALSE, 1450000
),
(
    'meta-llama/Llama-3.3-70B-Instruct', 'Meta', 'Llama 3.3 70B Instruct', 'Llama-3', 70.60, 'LlamaForCausalLM', 131072, 
    80, 8, 128, 128256, 'bfloat16', 'conversational', 'Llama-3.3-Community', TRUE, 2890000
),
(
    'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', 'DeepSeek', 'DeepSeek R1 Distill Qwen 32B', 'DeepSeek-R1', 32.50, 'Qwen2ForCausalLM', 131072, 
    64, 8, 128, 152064, 'bfloat16', 'reasoning', 'MIT', FALSE, 3200000
),
(
    'mistralai/Mistral-Nemo-Instruct-2407', 'Mistral AI', 'Mistral NeMo 12B Instruct', 'Mistral', 12.20, 'MistralForCausalLM', 131072, 
    40, 8, 128, 131072, 'bfloat16', 'conversational', 'Apache-2.0', FALSE, 890000
)
ON CONFLICT (id) DO NOTHING;

-- Benchmarks Catalog Seeds
INSERT INTO benchmarks (
    id, organization_id, is_private, synthetic_fixture, schema_version, golden,
    model_id, model_revision, hardware_id, hardware_count, runtime, runtime_version,
    precision_type, quantization_method, prompt_tokens, generated_tokens, context_length,
    batch_size, concurrency, ttft_p50_ms, ttft_p95_ms, tpot_p50_ms, tpot_p95_ms,
    tokens_per_second, requests_per_second, peak_vram_bytes, power_watts_avg, sample_count,
    quality_benchmark, quality_score, quality_retention, environment_hash, result_hash,
    submitted_by, runner_version, started_at, completed_at, verification_status, reproduction_count, verified_by
) VALUES
(
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', NULL, FALSE, FALSE, '1.0.0', TRUE,
    'Qwen/Qwen2.5-32B-Instruct', 'main', 'nvidia-l40s-48gb', 1, 'vllm', '0.6.4',
    'fp8', 'fp8_e4m3', 1024, 256, 1280,
    1, 1, 280.00, 330.00, 13.80, 15.10,
    72.40, 0.28, 38654705664, 295.00, 25,
    'MMLU-Pro', 56.40, 0.9930, 'env_hash_l40s_vllm_064_fp8', 'res_hash_qwen32b_fp8_l40s',
    'ModelForge-Core-Lab', '1.0.0', '2025-01-20T10:00:00Z', '2025-01-20T10:15:00Z', 'verified', 5, 'ModelForge Automated Harness'
),
(
    'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', NULL, FALSE, FALSE, '1.0.0', TRUE,
    'meta-llama/Llama-3.3-70B-Instruct', 'main', 'nvidia-h100-sxm5-80gb', 1, 'vllm', '0.6.4',
    'fp8', 'fp8_e4m3', 1024, 256, 1280,
    1, 1, 195.00, 235.00, 11.20, 12.30,
    88.60, 0.34, 75161927680, 540.00, 50,
    'MMLU-Pro', 68.20, 0.9960, 'env_hash_h100_vllm_064_fp8', 'res_hash_llama70b_fp8_h100',
    'Enterprise-Lab-Austin', '1.0.0', '2025-01-22T14:00:00Z', '2025-01-22T14:30:00Z', 'verified', 4, 'ModelForge Lab'
),
(
    'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', NULL, FALSE, FALSE, '1.0.0', FALSE,
    'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', 'main', 'nvidia-rtx-4090-24gb', 1, 'llama.cpp', 'b3600',
    'awq', 'q4_k_m', 512, 512, 1024,
    1, 1, 420.00, 490.00, 22.60, 24.10,
    44.20, 0.08, 21474836480, 380.00, 12,
    'GSM8k', 82.50, 0.9880, 'env_hash_rtx4090_llamacpp_awq', 'res_hash_deepseek32b_awq_4090',
    'Community-Node-4481', '1.0.0', '2025-01-25T08:00:00Z', '2025-01-25T08:20:00Z', 'community', 1, NULL
)
ON CONFLICT (id) DO NOTHING;

-- Compute Passports Seeds
INSERT INTO compute_passports (
    model_id, revision, hf_url, architecture, parameters_billions, context_window,
    license, gated, compatibility, memory_profile, coverage, deployment_profiles,
    confidence_score, confidence_explanation
) VALUES
(
    'Qwen/Qwen2.5-32B-Instruct', 'main', 'https://huggingface.co/Qwen/Qwen2.5-32B-Instruct',
    'Qwen2ForCausalLM', 32.50, 131072, 'Apache-2.0', FALSE,
    '{"vllm": {"status": "SUPPORTED", "min_version": "0.5.4", "recommended_runtime": "vllm >= 0.6.4"}, "tensorrt-llm": {"status": "SUPPORTED", "min_version": "0.12.0"}, "nvidia-dynamo": {"status": "SUPPORTED", "notes": "Disaggregated Prefill/Decode verified"}}'::jsonb,
    '{"weights_fp16_gb": 65.0, "weights_fp8_gb": 32.5, "weights_int4_gb": 17.8, "kv_cache_per_1k_tokens_gb": 0.25}'::jsonb,
    '{"benchmarks_count": 8, "accelerators_tested": ["NVIDIA L40S", "NVIDIA H100", "NVIDIA RTX 4090"], "reproductions_count": 5}'::jsonb,
    '[{"target": "NVIDIA Dynamo", "hardware": "2x L40S 48GB", "throughput_tps": 86.8, "p95_ttft_ms": 195}, {"target": "vLLM", "hardware": "1x L40S 48GB", "throughput_tps": 72.4, "p95_ttft_ms": 330}]'::jsonb,
    94, 'Deterministic confidence calculated by ModelForge Algorithm 1.0.0: revision match, 8 verified benchmarks across 3 accelerator families, and 5 independent reproductions.'
),
(
    'meta-llama/Llama-3.3-70B-Instruct', 'main', 'https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct',
    'LlamaForCausalLM', 70.60, 131072, 'Llama-3.3-Community', TRUE,
    '{"vllm": {"status": "SUPPORTED", "min_version": "0.6.0"}, "tensorrt-llm": {"status": "SUPPORTED", "min_version": "0.14.0"}, "nvidia-dynamo": {"status": "SUPPORTED"}}'::jsonb,
    '{"weights_fp16_gb": 141.2, "weights_fp8_gb": 70.6, "weights_int4_gb": 38.5, "kv_cache_per_1k_tokens_gb": 0.50}'::jsonb,
    '{"benchmarks_count": 12, "accelerators_tested": ["NVIDIA H100 SXM5 80GB", "NVIDIA H200 141GB", "AMD Instinct MI300X 192GB"], "reproductions_count": 4}'::jsonb,
    '[{"target": "NVIDIA Dynamo", "hardware": "2x H100 80GB", "throughput_tps": 142.5, "p95_ttft_ms": 150}, {"target": "vLLM", "hardware": "1x H100 80GB", "throughput_tps": 88.6, "p95_ttft_ms": 235}]'::jsonb,
    96, 'High confidence: validated on H100 and H200 with 12 benchmarks and 4 enterprise reproductions.'
)
ON CONFLICT (model_id, revision) DO NOTHING;

-- Benchmark Reproductions Seeds
INSERT INTO benchmark_reproductions (
    original_benchmark_id, reproduction_benchmark_id, throughput_delta_percent,
    ttft_delta_percent, vram_delta_bytes, verified_match
) VALUES
(
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    1.20, 2.10, 10485760, TRUE
);

-- Failure Intelligence Seeds
INSERT INTO failure_records (
    id, model_repository, model_revision, runtime, accelerator,
    failure_category, normalized_reason
) VALUES
(
    'f1a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c51', 'meta-llama/Llama-3.3-70B-Instruct', 'main', 'vllm', 'NVIDIA GeForce RTX 4090 24GB (1x)',
    'OUT_OF_MEMORY', 'Model weights (70.6B FP16) require ~141.2 GB VRAM, exceeding single RTX 4090 capacity (24 GB).'
),
(
    'f1a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c52', 'meta-llama/Llama-3.3-70B-Instruct', 'main', 'transformers', 'NVIDIA L40S 48GB (1x)',
    'OUT_OF_MEMORY', 'CUDA out of memory during model weight allocation in FP16 on single 48GB accelerator.'
),
(
    'f1a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c53', 'Qwen/Qwen2.5-32B-Instruct', 'main', 'vllm', 'NVIDIA GeForce RTX 4090 24GB (1x)',
    'OUT_OF_MEMORY', 'Weights in FP16 require 65.0 GB VRAM. Exceeds 24.0 GB physical device memory.'
),
(
    'f1a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c54', 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', 'main', 'tensorrt-llm', 'NVIDIA L40S 48GB (1x)',
    'DRIVER_INCOMPATIBILITY', 'TensorRT-LLM v0.16.0 requires NVIDIA driver >= 535.86 and CUDA 12.2+. Host had driver 525.105.'
),
(
    'f1a2b3c4-d5e6-4a5b-8c9d-0e1f2a3b4c55', 'google/gemma-2-27b-it', 'main', 'transformers', 'Hugging Face ZeroGPU (16GB)',
    'INVALID_CONFIGURATION', 'Gemma-2-27B requires 34GB+ VRAM, exceeding standard ZeroGPU 16GB allocation limit.'
)
ON CONFLICT (id) DO NOTHING;

