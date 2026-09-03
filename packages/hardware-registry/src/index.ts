import { z } from 'zod';

export type AcceleratorVendor = 'nvidia' | 'amd' | 'apple' | 'intel' | 'cpu';

export const ManufacturerSpecsSchema = z.object({
  architecture: z.string(),
  vram_bytes: z.number().int().positive(),
  memory_bandwidth_gb_s: z.number().positive(),
  bus_width_bits: z.number().int().positive().optional(),
  tdp_watts: z.number().positive(),
  fp32_tflops: z.number().positive().optional(),
  tf32_tflops: z.number().positive().optional(),
  fp16_tflops: z.number().positive().optional(),
  bf16_tflops: z.number().positive().optional(),
  fp8_tflops: z.number().positive().optional(),
  int8_tops: z.number().positive().optional(),
  int4_tops: z.number().positive().optional(),
  interconnect: z.enum(['pcie_gen4', 'pcie_gen5', 'nvlink_3', 'nvlink_4', 'nvlink_5', 'infinity_fabric', 'unified_memory', 'system_bus']),
  max_interconnect_bandwidth_gb_s: z.number().positive().optional(),
  compute_capability: z.string().optional()
});
export type ManufacturerSpecs = z.infer<typeof ManufacturerSpecsSchema>;

export const ObservedPerformanceSchema = z.object({
  observed_effective_bandwidth_gb_s: z.number().positive().optional(),
  max_observed_tokens_per_sec: z.number().positive().optional(),
  sample_count: z.number().int().nonnegative().default(0),
  last_measured_at: z.string().datetime().optional()
});
export type ObservedPerformance = z.infer<typeof ObservedPerformanceSchema>;

export const HardwareDeviceSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  vendor: z.enum(['nvidia', 'amd', 'apple', 'intel', 'cpu']),
  category: z.enum(['datacenter', 'workstation', 'consumer', 'edge', 'soc']),
  manufacturer: ManufacturerSpecsSchema,
  observed: ObservedPerformanceSchema.default({ sample_count: 0 }),
  supported_precisions: z.array(z.string()),
  supported_runtimes: z.array(z.string()),
  release_year: z.number().int(),
  typical_cloud_cost_per_hour_usd: z.number().nonnegative().optional()
});
export type HardwareDevice = z.infer<typeof HardwareDeviceSchema>;

export interface AcceleratorProvider {
  readonly vendor: AcceleratorVendor;
  getDevice(slug: string): HardwareDevice | undefined;
  listDevices(): HardwareDevice[];
  isRuntimeSupported(deviceSlug: string, runtime: string): boolean;
  isPrecisionSupported(deviceSlug: string, precision: string): boolean;
}

export const HARDWARE_CATALOG: HardwareDevice[] = [
  // NVIDIA Datacenter & Workstation
  {
    id: 'nvidia-h100-sxm5-80gb',
    slug: 'h100-sxm5-80gb',
    name: 'NVIDIA H100 SXM5 80GB',
    vendor: 'nvidia',
    category: 'datacenter',
    manufacturer: {
      architecture: 'Hopper',
      vram_bytes: 85899345920, // 80 GB
      memory_bandwidth_gb_s: 3350,
      tdp_watts: 700,
      fp32_tflops: 67,
      tf32_tflops: 495,
      fp16_tflops: 990,
      bf16_tflops: 990,
      fp8_tflops: 1979,
      int8_tops: 1979,
      interconnect: 'nvlink_4',
      max_interconnect_bandwidth_gb_s: 900,
      compute_capability: '9.0'
    },
    observed: {
      observed_effective_bandwidth_gb_s: 2950,
      sample_count: 1420
    },
    supported_precisions: ['fp16', 'bf16', 'fp8', 'int8', 'int4', 'awq', 'gptq'],
    supported_runtimes: ['vllm', 'tensorrt-llm', 'sglang', 'tgi'],
    release_year: 2023,
    typical_cloud_cost_per_hour_usd: 3.20
  },
  {
    id: 'nvidia-h200-sxm-141gb',
    slug: 'h200-sxm-141gb',
    name: 'NVIDIA H200 SXM 141GB',
    vendor: 'nvidia',
    category: 'datacenter',
    manufacturer: {
      architecture: 'Hopper',
      vram_bytes: 151397597184, // 141 GB HBM3e
      memory_bandwidth_gb_s: 4800,
      tdp_watts: 700,
      fp16_tflops: 990,
      bf16_tflops: 990,
      fp8_tflops: 1979,
      interconnect: 'nvlink_4',
      max_interconnect_bandwidth_gb_s: 900,
      compute_capability: '9.0'
    },
    observed: {
      observed_effective_bandwidth_gb_s: 4200,
      sample_count: 310
    },
    supported_precisions: ['fp16', 'bf16', 'fp8', 'int8', 'int4'],
    supported_runtimes: ['vllm', 'tensorrt-llm', 'sglang'],
    release_year: 2024,
    typical_cloud_cost_per_hour_usd: 4.50
  },
  {
    id: 'nvidia-l40s-48gb',
    slug: 'l40s-48gb',
    name: 'NVIDIA L40S 48GB',
    vendor: 'nvidia',
    category: 'datacenter',
    manufacturer: {
      architecture: 'Ada Lovelace',
      vram_bytes: 51539607552, // 48 GB GDDR6
      memory_bandwidth_gb_s: 864,
      tdp_watts: 350,
      fp32_tflops: 91.6,
      fp16_tflops: 366,
      bf16_tflops: 366,
      fp8_tflops: 733,
      int8_tops: 733,
      interconnect: 'pcie_gen4',
      compute_capability: '8.9'
    },
    observed: {
      observed_effective_bandwidth_gb_s: 740,
      sample_count: 850
    },
    supported_precisions: ['fp16', 'bf16', 'fp8', 'int8', 'int4', 'awq'],
    supported_runtimes: ['vllm', 'tensorrt-llm', 'sglang', 'tgi', 'llama.cpp'],
    release_year: 2023,
    typical_cloud_cost_per_hour_usd: 1.15
  },
  {
    id: 'nvidia-a100-sxm4-80gb',
    slug: 'a100-sxm4-80gb',
    name: 'NVIDIA A100 SXM4 80GB',
    vendor: 'nvidia',
    category: 'datacenter',
    manufacturer: {
      architecture: 'Ampere',
      vram_bytes: 85899345920, // 80 GB HBM2e
      memory_bandwidth_gb_s: 2039,
      tdp_watts: 400,
      fp32_tflops: 19.5,
      tf32_tflops: 156,
      fp16_tflops: 312,
      bf16_tflops: 312,
      int8_tops: 624,
      interconnect: 'nvlink_3',
      max_interconnect_bandwidth_gb_s: 600,
      compute_capability: '8.0'
    },
    observed: {
      observed_effective_bandwidth_gb_s: 1820,
      sample_count: 3420
    },
    supported_precisions: ['fp16', 'bf16', 'int8', 'int4', 'awq', 'gptq'],
    supported_runtimes: ['vllm', 'tensorrt-llm', 'sglang', 'tgi'],
    release_year: 2020,
    typical_cloud_cost_per_hour_usd: 1.85
  },
  {
    id: 'nvidia-l4-24gb',
    slug: 'l4-24gb',
    name: 'NVIDIA L4 24GB',
    vendor: 'nvidia',
    category: 'datacenter',
    manufacturer: {
      architecture: 'Ada Lovelace',
      vram_bytes: 25769803776, // 24 GB GDDR6
      memory_bandwidth_gb_s: 300,
      tdp_watts: 72,
      fp16_tflops: 120,
      bf16_tflops: 120,
      fp8_tflops: 242,
      interconnect: 'pcie_gen4',
      compute_capability: '8.9'
    },
    observed: {
      observed_effective_bandwidth_gb_s: 255,
      sample_count: 590
    },
    supported_precisions: ['fp16', 'bf16', 'fp8', 'int8', 'int4'],
    supported_runtimes: ['vllm', 'tensorrt-llm', 'sglang', 'llama.cpp'],
    release_year: 2023,
    typical_cloud_cost_per_hour_usd: 0.65
  },

  // NVIDIA Consumer / Enthusiast
  {
    id: 'nvidia-rtx-4090-24gb',
    slug: 'rtx-4090-24gb',
    name: 'NVIDIA GeForce RTX 4090 24GB',
    vendor: 'nvidia',
    category: 'consumer',
    manufacturer: {
      architecture: 'Ada Lovelace',
      vram_bytes: 25769803776, // 24 GB GDDR6X
      memory_bandwidth_gb_s: 1008,
      tdp_watts: 450,
      fp32_tflops: 82.6,
      fp16_tflops: 330,
      bf16_tflops: 330,
      fp8_tflops: 660,
      int8_tops: 660,
      interconnect: 'pcie_gen4',
      compute_capability: '8.9'
    },
    observed: {
      observed_effective_bandwidth_gb_s: 880,
      sample_count: 4120
    },
    supported_precisions: ['fp16', 'bf16', 'fp8', 'int8', 'int4', 'awq', 'gptq'],
    supported_runtimes: ['vllm', 'tensorrt-llm', 'llama.cpp', 'sglang'],
    release_year: 2022,
    typical_cloud_cost_per_hour_usd: 0.75
  },
  {
    id: 'nvidia-rtx-5090-32gb',
    slug: 'rtx-5090-32gb',
    name: 'NVIDIA GeForce RTX 5090 32GB',
    vendor: 'nvidia',
    category: 'consumer',
    manufacturer: {
      architecture: 'Blackwell',
      vram_bytes: 34359738368, // 32 GB GDDR7
      memory_bandwidth_gb_s: 1792,
      tdp_watts: 600,
      fp16_tflops: 650,
      bf16_tflops: 650,
      fp8_tflops: 1300,
      int8_tops: 1300,
      interconnect: 'pcie_gen5',
      compute_capability: '12.0'
    },
    observed: {
      observed_effective_bandwidth_gb_s: 1510,
      sample_count: 240
    },
    supported_precisions: ['fp16', 'bf16', 'fp8', 'fp4', 'int8', 'int4'],
    supported_runtimes: ['vllm', 'tensorrt-llm', 'llama.cpp', 'sglang'],
    release_year: 2025,
    typical_cloud_cost_per_hour_usd: 1.25
  },
  {
    id: 'nvidia-rtx-3090-24gb',
    slug: 'rtx-3090-24gb',
    name: 'NVIDIA GeForce RTX 3090 24GB',
    vendor: 'nvidia',
    category: 'consumer',
    manufacturer: {
      architecture: 'Ampere',
      vram_bytes: 25769803776, // 24 GB GDDR6X
      memory_bandwidth_gb_s: 936,
      tdp_watts: 350,
      fp32_tflops: 35.6,
      fp16_tflops: 142,
      bf16_tflops: 142,
      int8_tops: 284,
      interconnect: 'pcie_gen4',
      compute_capability: '8.6'
    },
    observed: {
      observed_effective_bandwidth_gb_s: 790,
      sample_count: 2890
    },
    supported_precisions: ['fp16', 'bf16', 'int8', 'int4', 'awq', 'gptq'],
    supported_runtimes: ['vllm', 'llama.cpp'],
    release_year: 2020,
    typical_cloud_cost_per_hour_usd: 0.45
  },

  // AMD Accelerators
  {
    id: 'amd-instinct-mi300x-192gb',
    slug: 'instinct-mi300x-192gb',
    name: 'AMD Instinct MI300X 192GB',
    vendor: 'amd',
    category: 'datacenter',
    manufacturer: {
      architecture: 'CDNA 3',
      vram_bytes: 206158430208, // 192 GB HBM3
      memory_bandwidth_gb_s: 5300,
      tdp_watts: 750,
      fp16_tflops: 1307,
      bf16_tflops: 1307,
      fp8_tflops: 2614,
      int8_tops: 2614,
      interconnect: 'infinity_fabric',
      max_interconnect_bandwidth_gb_s: 896
    },
    observed: {
      observed_effective_bandwidth_gb_s: 4600,
      sample_count: 420
    },
    supported_precisions: ['fp16', 'bf16', 'fp8', 'int8', 'int4'],
    supported_runtimes: ['vllm', 'sglang', 'tgi'],
    release_year: 2024,
    typical_cloud_cost_per_hour_usd: 3.50
  },
  {
    id: 'amd-radeon-rx-7900-xtx-24gb',
    slug: 'radeon-rx-7900-xtx-24gb',
    name: 'AMD Radeon RX 7900 XTX 24GB',
    vendor: 'amd',
    category: 'consumer',
    manufacturer: {
      architecture: 'RDNA 3',
      vram_bytes: 25769803776, // 24 GB GDDR6
      memory_bandwidth_gb_s: 960,
      tdp_watts: 355,
      fp16_tflops: 123,
      bf16_tflops: 123,
      interconnect: 'pcie_gen4'
    },
    observed: {
      observed_effective_bandwidth_gb_s: 780,
      sample_count: 610
    },
    supported_precisions: ['fp16', 'bf16', 'int8', 'int4'],
    supported_runtimes: ['vllm', 'llama.cpp'],
    release_year: 2022,
    typical_cloud_cost_per_hour_usd: 0.50
  },
  {
    id: 'amd-radeon-890m-igpu',
    slug: 'radeon-890m',
    name: 'AMD Radeon 890M iGPU',
    vendor: 'amd',
    category: 'soc',
    manufacturer: {
      architecture: 'RDNA 3.5',
      vram_bytes: 17179869184, // Shared up to 16 GB from system LPDDR5X
      memory_bandwidth_gb_s: 120,
      tdp_watts: 35,
      interconnect: 'system_bus'
    },
    observed: {
      observed_effective_bandwidth_gb_s: 95,
      sample_count: 85
    },
    supported_precisions: ['fp16', 'bf16', 'int8', 'int4'],
    supported_runtimes: ['llama.cpp'],
    release_year: 2024
  },

  // Apple Silicon
  {
    id: 'apple-m3-ultra-192gb',
    slug: 'apple-m3-ultra-192gb',
    name: 'Apple M3 Ultra 192GB',
    vendor: 'apple',
    category: 'soc',
    manufacturer: {
      architecture: 'Apple Silicon M3',
      vram_bytes: 206158430208, // 192 GB Unified Memory
      memory_bandwidth_gb_s: 800,
      tdp_watts: 140,
      interconnect: 'unified_memory'
    },
    observed: {
      observed_effective_bandwidth_gb_s: 690,
      sample_count: 310
    },
    supported_precisions: ['fp16', 'bf16', 'int8', 'int4'],
    supported_runtimes: ['llama.cpp', 'transformers'],
    release_year: 2024
  },
  {
    id: 'apple-m4-max-128gb',
    slug: 'apple-m4-max-128gb',
    name: 'Apple M4 Max 128GB',
    vendor: 'apple',
    category: 'soc',
    manufacturer: {
      architecture: 'Apple Silicon M4',
      vram_bytes: 137438953472, // 128 GB Unified Memory
      memory_bandwidth_gb_s: 546,
      tdp_watts: 100,
      interconnect: 'unified_memory'
    },
    observed: {
      observed_effective_bandwidth_gb_s: 480,
      sample_count: 420
    },
    supported_precisions: ['fp16', 'bf16', 'int8', 'int4'],
    supported_runtimes: ['llama.cpp', 'transformers'],
    release_year: 2024
  },

  // CPU Fallback / Generic
  {
    id: 'generic-cpu-server-128gb',
    slug: 'server-cpu-128gb',
    name: 'x86_64 Server CPU (AVX-512 / AMX) 128GB',
    vendor: 'cpu',
    category: 'datacenter',
    manufacturer: {
      architecture: 'x86_64 AVX-512',
      vram_bytes: 137438953472, // 128 GB System RAM
      memory_bandwidth_gb_s: 200,
      tdp_watts: 250,
      interconnect: 'system_bus'
    },
    observed: {
      observed_effective_bandwidth_gb_s: 140,
      sample_count: 510
    },
    supported_precisions: ['fp32', 'bf16', 'int8', 'int4'],
    supported_runtimes: ['llama.cpp', 'transformers'],
    release_year: 2023,
    typical_cloud_cost_per_hour_usd: 0.40
  }
];

class BaseAcceleratorProvider implements AcceleratorProvider {
  constructor(readonly vendor: AcceleratorVendor) {}

  getDevice(slug: string): HardwareDevice | undefined {
    return HARDWARE_CATALOG.find(
      (d) => d.vendor === this.vendor && (d.slug === slug || d.id === slug)
    );
  }

  listDevices(): HardwareDevice[] {
    return HARDWARE_CATALOG.filter((d) => d.vendor === this.vendor);
  }

  isRuntimeSupported(deviceSlug: string, runtime: string): boolean {
    const device = this.getDevice(deviceSlug);
    if (!device) return false;
    return device.supported_runtimes.includes(runtime);
  }

  isPrecisionSupported(deviceSlug: string, precision: string): boolean {
    const device = this.getDevice(deviceSlug);
    if (!device) return false;
    return device.supported_precisions.includes(precision);
  }
}

export const nvidiaProvider = new BaseAcceleratorProvider('nvidia');
export const amdProvider = new BaseAcceleratorProvider('amd');
export const appleProvider = new BaseAcceleratorProvider('apple');
export const cpuProvider = new BaseAcceleratorProvider('cpu');

export function getAcceleratorProvider(vendor: AcceleratorVendor): AcceleratorProvider {
  switch (vendor) {
    case 'nvidia':
      return nvidiaProvider;
    case 'amd':
      return amdProvider;
    case 'apple':
      return appleProvider;
    case 'cpu':
      return cpuProvider;
    default:
      return cpuProvider;
  }
}

export function getHardwareDevice(idOrSlug: string): HardwareDevice | undefined {
  return HARDWARE_CATALOG.find((d) => d.slug === idOrSlug || d.id === idOrSlug);
}

export function listHardwareDevices(filters?: {
  vendor?: AcceleratorVendor;
  category?: string;
  minVramGb?: number;
}): HardwareDevice[] {
  return HARDWARE_CATALOG.filter((device) => {
    if (filters?.vendor && device.vendor !== filters.vendor) return false;
    if (filters?.category && device.category !== filters.category) return false;
    if (filters?.minVramGb) {
      const vramGb = device.manufacturer.vram_bytes / 1e9;
      if (vramGb < filters.minVramGb) return false;
    }
    return true;
  });
}
