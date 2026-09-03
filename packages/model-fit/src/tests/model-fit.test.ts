import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { computeModelFit } from '../index.js';
import { getHardwareDevice } from '@modelforge/hardware-registry';

describe('ModelFit Scoring Engine', () => {
  it('computes realistic memory requirement and score for Qwen 32B FP8 on L40S', () => {
    const result = computeModelFit({
      model: {
        id: 'Qwen/Qwen2.5-32B-Instruct',
        parameters_billions: 32.5,
        context_window: 32768,
        layers: 64,
        kv_heads: 8,
        head_dim: 128,
        architecture: 'Qwen2ForCausalLM'
      },
      hardware: {
        device_slug: 'l40s-48gb',
        device_count: 1
      },
      runtime: {
        name: 'vllm',
        version: '0.6.4'
      },
      precision: 'fp8',
      workload: {
        context_length: 4096,
        prompt_tokens: 1024,
        generated_tokens: 256,
        concurrency: 2,
        target_tpot_ms: 25
      },
      benchmark_provenance: 'verified'
    });

    assert.ok(result.overall_score >= 85, `Expected score >= 85, got ${result.overall_score}`);
    assert.strictEqual(result.memory_breakdown.is_oom, false);
    assert.strictEqual(result.dimensions.memory_fit >= 90, true);
    assert.strictEqual(result.dimensions.evidence_confidence, 98);
  });

  it('detects OOM when running 70B model in FP16 on a single 24GB GPU', () => {
    const l4 = getHardwareDevice('l4-24gb');
    assert.ok(l4);

    const result = computeModelFit({
      model: {
        id: 'meta-llama/Llama-3.3-70B-Instruct',
        parameters_billions: 70.6,
        context_window: 131072,
        layers: 80,
        kv_heads: 8,
        head_dim: 128,
        architecture: 'LlamaForCausalLM'
      },
      hardware: {
        device_slug: 'l4-24gb',
        device_count: 1
      },
      runtime: {
        name: 'vllm',
        version: '0.6.4'
      },
      precision: 'fp16',
      workload: {
        context_length: 2048,
        prompt_tokens: 512,
        generated_tokens: 128,
        concurrency: 1
      },
      benchmark_provenance: 'estimated'
    });

    assert.strictEqual(result.memory_breakdown.is_oom, true);
    assert.ok(result.overall_score <= 30);
    assert.strictEqual(result.grade, 'F');
    assert.ok(result.warnings.some((w) => w.includes('OOM')));
  });
});
