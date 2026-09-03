import { NextRequest, NextResponse } from 'next/server';
import { compileSLOToDeploymentPlan, WorkloadFingerprint, SLOSpec } from '@modelforge/slo-compiler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const modelRepo = body.model_id || body.model || 'Qwen/Qwen2.5-32B-Instruct';
    const revision = body.revision || 'main';

    const workload: WorkloadFingerprint = {
      fingerprint_id: `wf-${Date.now()}`,
      task_type: body.workload?.task_type || 'rag',
      prompt_token_mean: body.workload?.prompt_token_mean || 2048,
      output_token_mean: body.workload?.output_token_mean || 512,
      context_length_target: body.workload?.context_length_target || 4096,
      target_concurrency: body.workload?.target_concurrency || 8,
      requests_per_day: body.workload?.requests_per_day || 50000,
      streaming_required: body.workload?.streaming_required ?? true,
      arrival_pattern: body.workload?.arrival_pattern || 'bursty'
    };

    const slo: SLOSpec = {
      max_p95_ttft_ms: body.slo?.max_p95_ttft_ms || 400,
      max_p95_tpot_ms: body.slo?.max_p95_tpot_ms || 35,
      max_cost_per_1m_tokens_usd: body.slo?.max_cost_per_1m_tokens_usd || 1.50,
      require_disaggregated_prefill_decode: body.slo?.require_disaggregated_prefill_decode ?? (workload.target_concurrency >= 8)
    };

    const plan = compileSLOToDeploymentPlan(modelRepo, revision, workload, slo);
    return NextResponse.json(plan, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Invalid compilation request' }, { status: 400 });
  }
}
