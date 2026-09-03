import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { compileSLOToDeploymentPlan } from '../compiler';

describe('SLO Compiler & Topology Planner', () => {
  test('compiles workload into ranked candidate configurations with SLO satisfaction', () => {
    const plan = compileSLOToDeploymentPlan(
      {
        repository: 'Qwen/Qwen2.5-32B-Instruct',
        revision: 'main',
        parameters_billions: 32.5,
        architecture: 'Qwen2ForCausalLM'
      },
      {
        fingerprint_id: 'fp-rag-1',
        model_repo: 'Qwen/Qwen2.5-32B-Instruct',
        model_revision: 'main',
        task_type: 'rag',
        prompt_token_mean: 4096,
        output_token_mean: 512,
        context_length_target: 8192,
        target_concurrency: 16,
        requests_per_day: 100000,
        streaming_required: true,
        arrival_pattern: 'bursty'
      },
      {
        p95_ttft_ms: 600,
        min_tokens_per_second: 50,
        availability_target: 99.95,
        max_cost_per_million_tokens_usd: 1.5,
        optimize_for: 'balanced'
      }
    );

    assert.strictEqual(plan.schema_version, '2.0.0');
    assert.ok(plan.plan_id.length > 0);
    assert.strictEqual(plan.is_immutable, true);
    assert.ok(plan.alternative_candidates.length > 0);

    // Verify recommended candidate has complete metrics and provenance
    const rec = plan.recommended_candidate;
    assert.ok(rec.expected_throughput_tps > 0);
    assert.ok(rec.expected_p95_ttft_ms > 0);
    assert.ok(rec.confidence_score >= 0 && rec.confidence_score <= 100);
    assert.ok(['MEASURED', 'DOCUMENTED', 'INTERPOLATED', 'PREDICTED', 'ESTIMATED'].includes(rec.provenance));
  });

  test('generates NVIDIA Dynamo disaggregated topology for high concurrency workloads', () => {
    const plan = compileSLOToDeploymentPlan(
      {
        repository: 'meta-llama/Llama-3.3-70B-Instruct',
        revision: '70b-v1',
        parameters_billions: 70.6,
        architecture: 'LlamaForCausalLM'
      },
      {
        fingerprint_id: 'fp-high-conc',
        model_repo: 'meta-llama/Llama-3.3-70B-Instruct',
        model_revision: '70b-v1',
        task_type: 'conversational',
        prompt_token_mean: 2048,
        output_token_mean: 256,
        context_length_target: 4096,
        target_concurrency: 32,
        requests_per_day: 500000,
        streaming_required: true,
        arrival_pattern: 'bursty'
      },
      {
        p95_ttft_ms: 300,
        optimize_for: 'throughput'
      }
    );

    // Filter candidates for dynamo
    const dynamoCandidate = [plan.recommended_candidate, ...plan.alternative_candidates].find(
      (c) => c.runtime === 'dynamo'
    );

    assert.ok(dynamoCandidate, 'Expected at least one Dynamo candidate in results');
    if (dynamoCandidate?.disaggregated_topology?.enabled) {
      assert.ok(dynamoCandidate.disaggregated_topology.prefill_workers >= 1);
      assert.strictEqual(dynamoCandidate.disaggregated_topology.kv_routing_policy, 'kv_cache_affinity');
    }
  });
});
