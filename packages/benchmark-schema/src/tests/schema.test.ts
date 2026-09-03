import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  OpenComputeBenchSchema,
  computeEnvironmentHash,
  computeResultHash,
  validateBenchmarkIntegrity,
  OpenComputeBenchRecord
} from '../index.js';

describe('OpenComputeBench Schema & Integrity', () => {
  const sampleRecord: OpenComputeBenchRecord = {
    benchmark_id: '11111111-2222-3333-4444-555555555555',
    schema_version: '1.0.0',
    synthetic_fixture: false,
    model: {
      provider: 'Qwen',
      repository: 'Qwen/Qwen2.5-32B-Instruct',
      revision: 'main',
      architecture: 'Qwen2ForCausalLM',
      parameters_billions: 32.5,
      context_window: 131072,
      vocab_size: 152064
    },
    runtime: {
      name: 'vllm',
      version: '0.6.4',
      engine_args: { gpu_memory_utilization: 0.9 }
    },
    precision: {
      type: 'fp8',
      quantization_method: 'fp8_e4m3'
    },
    hardware: {
      vendor: 'nvidia',
      device: 'NVIDIA L40S',
      count: 1,
      vram_bytes_per_device: 51539607552, // 48 GB
      total_vram_bytes: 51539607552,
      interconnect: 'pcie'
    },
    software: {
      os: 'Ubuntu 22.04 LTS',
      driver_version: '550.54.15',
      cuda_version: '12.4',
      python_version: '3.12.2'
    },
    workload: {
      prompt_tokens: 1024,
      generated_tokens: 256,
      context_length: 1280,
      batch_size: 1,
      concurrency: 1
    },
    metrics: {
      ttft_ms: { p50_ms: 280, p90_ms: 310, p95_ms: 330, p99_ms: 360, mean_ms: 285 },
      tpot_ms: { p50_ms: 13.8, p90_ms: 14.5, p95_ms: 15.1, p99_ms: 16.0, mean_ms: 14.0 },
      tokens_per_second: 72.4,
      requests_per_second: 0.28,
      peak_vram_bytes: 38654705664,
      sample_count: 10
    },
    provenance: {
      submitted_by: 'OpenComputeBench-Automated',
      runner_version: '1.0.0',
      started_at: '2025-01-15T12:00:00.000Z',
      completed_at: '2025-01-15T12:05:00.000Z',
      environment_hash: '',
      result_hash: ''
    },
    verification: {
      status: 'verified',
      reproduction_count: 3
    }
  };

  // Compute correct hashes
  sampleRecord.provenance.environment_hash = computeEnvironmentHash(
    sampleRecord.hardware,
    sampleRecord.software,
    sampleRecord.runtime
  );
  sampleRecord.provenance.result_hash = computeResultHash(
    sampleRecord.model,
    sampleRecord.precision,
    sampleRecord.workload,
    sampleRecord.metrics
  );

  it('validates a correct OpenComputeBench record', () => {
    const parsed = OpenComputeBenchSchema.safeParse(sampleRecord);
    assert.strictEqual(parsed.success, true);
    const integrity = validateBenchmarkIntegrity(sampleRecord);
    assert.strictEqual(integrity.isValid, true);
    assert.strictEqual(integrity.errors.length, 0);
  });

  it('rejects tampered result hash', () => {
    const tampered = structuredClone(sampleRecord);
    tampered.metrics.tokens_per_second = 999.9; // Tampered throughput without recalculating hash
    const integrity = validateBenchmarkIntegrity(tampered);
    assert.strictEqual(integrity.isValid, false);
    assert.ok(integrity.errors.some((e) => e.includes('Result hash mismatch')));
  });

  it('rejects synthetic fixture marked as verified', () => {
    const synthetic = structuredClone(sampleRecord);
    synthetic.synthetic_fixture = true;
    synthetic.verification.status = 'verified';
    const integrity = validateBenchmarkIntegrity(synthetic);
    assert.strictEqual(integrity.isValid, false);
    assert.ok(integrity.errors.some((e) => e.includes('Synthetic fixtures cannot be marked as verified')));
  });
});
