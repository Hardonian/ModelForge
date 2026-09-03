import { describe, it } from "node:test";
import * as assert from "node:assert";
import {
  HARDWARE_CATALOG,
  getHardwareDevice,
  listHardwareDevices,
  nvidiaProvider,
  amdProvider,
} from "../index.js";

describe("Hardware Registry & Providers", () => {
  it("contains expected key accelerators", () => {
    assert.ok(HARDWARE_CATALOG.length >= 8);
    const h100 = getHardwareDevice("h100-sxm5-80gb");
    assert.ok(h100);
    assert.strictEqual(h100?.vendor, "nvidia");
    assert.strictEqual(h100?.manufacturer.vram_bytes, 85899345920);
    assert.strictEqual(h100?.manufacturer.interconnect, "nvlink_4");
  });

  it("filters devices by minimum VRAM", () => {
    const bigGpus = listHardwareDevices({ minVramGb: 80 });
    assert.ok(bigGpus.length > 0);
    assert.ok(bigGpus.every((g) => g.manufacturer.vram_bytes / 1e9 >= 80));
  });

  it("checks runtime support on NVIDIA vs AMD providers", () => {
    const isVllmSupportedOnH100 = nvidiaProvider.isRuntimeSupported(
      "h100-sxm5-80gb",
      "vllm",
    );
    assert.strictEqual(isVllmSupportedOnH100, true);

    const isFp8SupportedOnMi300x = amdProvider.isPrecisionSupported(
      "instinct-mi300x-192gb",
      "fp8",
    );
    assert.strictEqual(isFp8SupportedOnMi300x, true);
  });
});
