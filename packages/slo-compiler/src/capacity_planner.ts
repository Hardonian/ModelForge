import { HARDWARE_CATALOG } from "@modelforge/hardware-registry";

export interface DeploymentBase {
  model_id: string;
  parameters_billions: number;
  accelerator: string;
  device_count: number;
  runtime: string;
  precision: string;
  context_length: number;
  concurrency: number;
  hourly_cost_usd: number;
  baseline_ttft_ms: number;
  baseline_throughput_tok_s: number;
}

export interface ScenarioInput {
  name: string;
  traffic_growth_pct?: number;
  context_growth_pct?: number;
  target_accelerator?: string;
  target_runtime?: string;
  target_precision?: string;
}

export interface ScenarioResult {
  scenario_name: string;
  required_devices: number;
  gpu_requirement_delta: number;
  projected_p95_ttft_ms: number;
  projected_throughput_tok_s: number;
  projected_monthly_cost_usd: number;
  monthly_cost_delta_usd: number;
  capacity_headroom_pct: number;
  confidence_score: number;
  explanation: string;
}

export function simulateCapacityScenario(
  base: DeploymentBase,
  scenario: ScenarioInput,
): ScenarioResult {
  const trafficMult = 1.0 + (scenario.traffic_growth_pct || 0) / 100;
  const contextMult = 1.0 + (scenario.context_growth_pct || 0) / 100;

  const targetDeviceName = scenario.target_accelerator || base.accelerator;
  const targetRuntime = scenario.target_runtime || base.runtime;
  const targetPrecision = scenario.target_precision || base.precision;

  const hw =
    HARDWARE_CATALOG.find(
      (h) =>
        h.name.toLowerCase() === targetDeviceName.toLowerCase() ||
        h.id.toLowerCase() === targetDeviceName.toLowerCase(),
    ) || HARDWARE_CATALOG[0]!;

  // Sizing
  const bpp =
    targetPrecision === "fp16" ? 2.0 : targetPrecision === "fp8" ? 1.0 : 0.55;
  const weightGb = base.parameters_billions * bpp;
  const effectiveContext = base.context_length * contextMult;
  const effectiveConcurrency = Math.round(base.concurrency * trafficMult);

  const kvGb =
    (2 * 48 * 8 * 128 * effectiveContext * 1 * effectiveConcurrency) / 1e9;
  const totalRequiredVramGb = weightGb + kvGb + 2.0;

  const singleDeviceVramGb = hw.manufacturer.vram_bytes / 1e9;
  const requiredDevices = Math.max(
    1,
    Math.ceil(totalRequiredVramGb / (singleDeviceVramGb * 0.9)),
  );
  const deviceDelta = requiredDevices - base.device_count;

  // Runtime speedup factor
  let runtimeLift = 1.0;
  if (targetRuntime === "tensorrt-llm") runtimeLift = 1.35;
  else if (targetRuntime === "nvidia-dynamo") runtimeLift = 1.55;
  else if (targetRuntime === "vllm") runtimeLift = 1.15;

  // Latency & Throughput projections
  let baseSpeed = 1.0;
  if (targetDeviceName.includes("H100")) baseSpeed = 1.8;
  else if (targetDeviceName.includes("L40S")) baseSpeed = 1.2;
  else if (targetDeviceName.includes("4090")) baseSpeed = 1.0;

  const projectedTtftMs = Number(
    (base.baseline_ttft_ms / (baseSpeed * runtimeLift)).toFixed(1),
  );
  const projectedTps = Number(
    (
      base.baseline_throughput_tok_s *
      baseSpeed *
      runtimeLift *
      (requiredDevices / base.device_count)
    ).toFixed(1),
  );

  // Cost projections (730 hours/month)
  const deviceHourlyCost =
    hw.typical_cloud_cost_per_hour_usd ||
    base.hourly_cost_usd / base.device_count;
  const projectedHourlyCost = deviceHourlyCost * requiredDevices;
  const projectedMonthlyCost = projectedHourlyCost * 730;
  const baselineMonthlyCost = base.hourly_cost_usd * 730;
  const costDelta = Number(
    (projectedMonthlyCost - baselineMonthlyCost).toFixed(2),
  );

  // Headroom calculation
  const totalAvailableVramGb = requiredDevices * singleDeviceVramGb * 0.9;
  const headroomPct = Number(
    (
      ((totalAvailableVramGb - totalRequiredVramGb) / totalAvailableVramGb) *
      100
    ).toFixed(1),
  );

  let confidence = 85;
  if (scenario.traffic_growth_pct && scenario.traffic_growth_pct > 100)
    confidence -= 15;
  if (
    scenario.target_accelerator &&
    scenario.target_accelerator !== base.accelerator
  )
    confidence -= 10;

  const explanation = `Scenario '${scenario.name}': Evaluated traffic ×${trafficMult.toFixed(2)}, context ×${contextMult.toFixed(2)} on ${requiredDevices}× ${hw.name} running ${targetRuntime} (${targetPrecision}). Resulting capacity headroom is ${headroomPct}%.`;

  return {
    scenario_name: scenario.name,
    required_devices: requiredDevices,
    gpu_requirement_delta: deviceDelta,
    projected_p95_ttft_ms: projectedTtftMs,
    projected_throughput_tok_s: projectedTps,
    projected_monthly_cost_usd: Number(projectedMonthlyCost.toFixed(2)),
    monthly_cost_delta_usd: costDelta,
    capacity_headroom_pct: Math.max(0, headroomPct),
    confidence_score: Math.max(50, confidence),
    explanation,
  };
}
