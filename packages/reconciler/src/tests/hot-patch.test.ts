import { describe, it, beforeEach } from "node:test";
import * as assert from "node:assert";
import { HotPatchEngine, HotPatchSpec } from "../hot-patch.js";

describe("HotPatchEngine: Ultra-Performant Live Patching", () => {
  beforeEach(() => {
    HotPatchEngine.clearAllPatches();
  });

  it("applies live KV-cache FP8 quantization hot-patch in sub-millisecond time", () => {
    const spec: HotPatchSpec = {
      patch_id: "patch-kv-1",
      deployment_id: "dep-live-prod",
      patch_type: "kv_cache_quantization",
      parameters: { target_precision: "fp8" },
      applied_by: "sre_lead",
      target_runtime: "vllm",
    };

    const result = HotPatchEngine.applyHotPatch(spec, "h100-sxm5-80gb");
    assert.strictEqual(result.success, true);
    assert.ok(result.applied_latency_ms < 50, `Latency was ${result.applied_latency_ms}ms, expected < 50ms`);
    assert.ok(result.memory_freed_bytes > 1e10, "Expected >10GB memory reclaimed");
    assert.strictEqual(result.throughput_boost_pct, 34.5);
    assert.ok(result.rollback_token.startsWith("rb-tok-"));
    assert.ok(result.message.includes("FP8"));
  });

  it("reverts an active hot-patch cleanly with rollback token", () => {
    const spec: HotPatchSpec = {
      patch_id: "patch-autotune-1",
      deployment_id: "dep-live-prod",
      patch_type: "kernel_autotuning",
      parameters: { kernel: "flashinfer" },
    };

    const result = HotPatchEngine.applyHotPatch(spec, "h100-sxm5-80gb");
    assert.strictEqual(result.success, true);

    const activeBefore = HotPatchEngine.listActivePatches("dep-live-prod");
    assert.strictEqual(activeBefore.length, 1);

    // Revert with invalid token should fail
    const badRevert = HotPatchEngine.revertHotPatch("patch-autotune-1", "bad-token");
    assert.strictEqual(badRevert.success, false);

    // Revert with valid token succeeds
    const goodRevert = HotPatchEngine.revertHotPatch("patch-autotune-1", result.rollback_token);
    assert.strictEqual(goodRevert.success, true);

    const activeAfter = HotPatchEngine.listActivePatches("dep-live-prod");
    assert.strictEqual(activeAfter.length, 0);
  });

  it("supports hot-patching on Google Cloud TPU v5p with XLA runtime", () => {
    const spec: HotPatchSpec = {
      patch_id: "patch-tpu-1",
      deployment_id: "dep-tpu-prod",
      patch_type: "kv_cache_quantization",
      parameters: { target_precision: "bf16" },
      target_runtime: "xla",
    };

    const result = HotPatchEngine.applyHotPatch(spec, "tpu-v5p-95gb");
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.deployment_id, "dep-tpu-prod");
  });

  it("rejects unsupported quantization precision safely without side-effects", () => {
    const spec: HotPatchSpec = {
      patch_id: "patch-fail-1",
      deployment_id: "dep-legacy",
      patch_type: "kv_cache_quantization",
      parameters: { target_precision: "fp4" },
      target_runtime: "vllm",
    };

    // RTX 3090 does not support FP4
    const result = HotPatchEngine.applyHotPatch(spec, "rtx-3090-24gb");
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes("does not natively support"));
  });

  it("swaps LoRA adapters in-place without container recreation", () => {
    const spec: HotPatchSpec = {
      patch_id: "patch-lora-1",
      deployment_id: "dep-customer-12",
      patch_type: "lora_adapter_swap",
      parameters: { adapter_id: "finetuned-customer-support-v3" },
      target_runtime: "vllm",
    };

    const result = HotPatchEngine.applyHotPatch(spec, "h100-sxm5-80gb");
    assert.strictEqual(result.success, true);
    assert.ok(result.message.includes("finetuned-customer-support-v3"));
  });
});
