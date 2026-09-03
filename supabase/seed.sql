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
