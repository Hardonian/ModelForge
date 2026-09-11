import { NextRequest, NextResponse } from "next/server";
import { HotPatchEngine, HotPatchSpec } from "@modelforge/reconciler";
import { dataLayer } from "@modelforge/database";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deploymentId = searchParams.get("deployment_id") || undefined;
  const activePatches = HotPatchEngine.listActivePatches(deploymentId);
  return NextResponse.json({
    count: activePatches.length,
    patches: activePatches,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || "apply";

    if (action === "revert") {
      const { patch_id, rollback_token, organization_id } = body;
      if (!patch_id || !rollback_token) {
        return NextResponse.json(
          { error: "patch_id and rollback_token are required to revert a hot-patch" },
          { status: 400 }
        );
      }

      const revertResult = HotPatchEngine.revertHotPatch(patch_id, rollback_token);
      if (!revertResult.success) {
        return NextResponse.json({ error: revertResult.message }, { status: 400 });
      }

      dataLayer.recordControlAuditLog({
        log_id: `log-${Date.now()}`,
        organization_id: organization_id || "org-default",
        actor: { user_id: body.user_id || "admin", role: "admin", service_account: false },
        event_type: "rollback_completed",
        details: { patch_id, reason: "Hot-patch reverted by operator" },
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(revertResult);
    }

    // Apply action
    const spec: HotPatchSpec = {
      patch_id: body.patch_id || `hp-${crypto.randomUUID().slice(0, 8)}`,
      deployment_id: body.deployment_id || `dep-${crypto.randomUUID().slice(0, 8)}`,
      patch_type: body.patch_type,
      parameters: body.parameters || {},
      applied_by: body.applied_by || "web_console",
      target_cluster: body.target_cluster || "default-cluster",
      target_runtime: body.target_runtime || "vllm",
      created_at: new Date().toISOString(),
    };

    if (!spec.patch_type) {
      return NextResponse.json(
        { error: "patch_type is required (e.g. kv_cache_quantization, lora_adapter_swap, concurrency_budget, kernel_autotuning)" },
        { status: 400 }
      );
    }

    const hardwareSlug = body.hardware_slug || "h100-sxm5-80gb";
    const result = HotPatchEngine.applyHotPatch(spec, hardwareSlug);

    if (!result.success) {
      return NextResponse.json({ error: result.message, details: result }, { status: 422 });
    }

    dataLayer.recordControlAuditLog({
      log_id: `log-${Date.now()}`,
      organization_id: body.organization_id || "org-default",
      actor: { user_id: spec.applied_by || "web_console", role: "admin", service_account: false },
      event_type: "execution_started",
      details: {
        patch_id: spec.patch_id,
        patch_type: spec.patch_type,
        hardware_slug: hardwareSlug,
        latency_ms: result.applied_latency_ms,
        memory_freed_bytes: result.memory_freed_bytes,
        throughput_boost_pct: result.throughput_boost_pct,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
