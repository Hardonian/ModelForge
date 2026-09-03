import { NextRequest, NextResponse } from "next/server";
import { dataLayer } from "@modelforge/database";
import { TelemetryWindowSchema } from "@modelforge/benchmark-schema";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deploymentId = searchParams.get("deployment_id");
  if (!deploymentId) {
    return NextResponse.json({ error: "deployment_id is required" }, { status: 400 });
  }

  const telemetry = dataLayer.listTelemetryWindows(deploymentId);
  return NextResponse.json(telemetry);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // STRICT ZERO PROMPT LOGGING ENFORCEMENT
    const forbiddenKeys = ["prompt", "prompt_text", "input_text", "response", "output_text", "messages"];
    for (const key of forbiddenKeys) {
      if (key in body) {
        return NextResponse.json(
          {
            error: "Zero Prompt Logging Violation: Raw prompts and outputs must never be submitted to ModelForge telemetry.",
          },
          { status: 400 }
        );
      }
    }

    const parsed = TelemetryWindowSchema.safeParse({
      ...body,
      id: body.id || crypto.randomUUID(),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid telemetry window schema", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const saved = dataLayer.recordTelemetryWindow(parsed.data);
    return NextResponse.json(saved, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
