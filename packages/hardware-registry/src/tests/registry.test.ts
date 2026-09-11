import { describe, it } from "node:test";
import * as assert from "node:assert";
import {
  HARDWARE_CATALOG,
  getHardwareDevice,
  listHardwareDevices,
  nvidiaProvider,
  amdProvider,
  intelProvider,
  getAcceleratorProvider,
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

  it("registers NVIDIA Blackwell B200 and GB200 NVL72 with NVLink 5 and FP4", () => {
    const b200 = getHardwareDevice("b200-sxm-192gb");
    assert.ok(b200);
    assert.strictEqual(b200?.vendor, "nvidia");
    assert.strictEqual(b200?.manufacturer.architecture, "Blackwell");
    assert.strictEqual(b200?.manufacturer.vram_bytes, 206158430208);
    assert.strictEqual(b200?.manufacturer.interconnect, "nvlink_5");
    assert.strictEqual(b200?.supported_precisions.includes("fp4"), true);

    const gb200 = getHardwareDevice("gb200-nvl72");
    assert.ok(gb200);
    assert.strictEqual(gb200?.manufacturer.architecture, "Blackwell NVL72");
    assert.strictEqual(gb200?.manufacturer.interconnect, "nvlink_5");
    assert.strictEqual(gb200?.supported_runtimes.includes("dynamo"), true);
  });

  it("registers AMD MI350X and Intel Gaudi 3 accelerators", () => {
    const mi350x = getHardwareDevice("instinct-mi350x-288gb");
    assert.ok(mi350x);
    assert.strictEqual(mi350x?.vendor, "amd");
    assert.strictEqual(mi350x?.manufacturer.architecture, "CDNA 4");
    assert.strictEqual(mi350x?.manufacturer.vram_bytes, 309237645312);

    const gaudi3 = getHardwareDevice("gaudi-3-128gb");
    assert.ok(gaudi3);
    assert.strictEqual(gaudi3?.vendor, "intel");
    assert.strictEqual(gaudi3?.manufacturer.architecture, "Gaudi 3");
    assert.strictEqual(intelProvider.isRuntimeSupported("gaudi-3-128gb", "vllm"), true);
    assert.strictEqual(getAcceleratorProvider("intel").vendor, "intel");
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

