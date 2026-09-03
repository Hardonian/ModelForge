import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";
import { PerformancePredictor } from "@modelforge/performance-predictor";

export const dynamic = "force-dynamic";

const predictor = new PerformancePredictor();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      model_repository,
      model_revision,
      parameters_billions,
      accelerator,
      device_count,
      runtime,
      precision,
      workload,
    } = body;

    if (!model_repository || !parameters_billions || !accelerator) {
      return NextResponse.json(
        {
          error:
            "model_repository, parameters_billions, and accelerator are required",
        },
        { status: 400 },
      );
    }

    const corpus = dataLayer.listBenchmarks();
    const prediction = predictor.predict(
      {
        model_repository,
        model_revision: model_revision || "main",
        parameters_billions: Number(parameters_billions),
        accelerator,
        device_count: device_count ? Number(device_count) : 1,
        runtime: runtime || "vllm",
        precision: precision || "fp8",
        workload: workload || {
          prompt_tokens: 1024,
          generated_tokens: 256,
          context_length: 4096,
          batch_size: 4,
          concurrency: 4,
        },
      },
      corpus,
    );

    return NextResponse.json(prediction);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
