import { NextRequest, NextResponse } from "next/server";
import { HARDWARE_CATALOG } from "@modelforge/hardware-registry";

export async function GET() {
  const googleDevices = HARDWARE_CATALOG.filter((d) => d.vendor === "google");

  return NextResponse.json({
    status: "healthy",
    cloud_provider: "google_cloud",
    project_id: process.env.GOOGLE_CLOUD_PROJECT || "modelforge-enterprise-gcp",
    region: process.env.GOOGLE_CLOUD_REGION || "us-central1",
    tpu_fleet: {
      total_clusters: 3,
      accelerator_inventory: googleDevices.map((d) => ({
        id: d.id,
        name: d.name,
        architecture: d.manufacturer.architecture,
        vram_gb: Number((d.manufacturer.vram_bytes / 1e9).toFixed(1)),
        interconnect: d.manufacturer.interconnect,
        bandwidth_gb_s: d.manufacturer.memory_bandwidth_gb_s,
        ici_bandwidth_gb_s: d.manufacturer.max_interconnect_bandwidth_gb_s,
      })),
      active_topologies: [
        {
          cluster_name: "gke-tpu-v6e-trillium-01",
          zone: "us-central1-a",
          tpu_type: "tpu-v6e-slice",
          slice_topology: "2x2x2",
          chip_count: 8,
          interconnect_type: "Optical Circuit Switch (OCS)",
          models_serving: ["google/gemma-2-27b-it"],
          utilization_pct: 78.4,
        },
        {
          cluster_name: "gke-tpu-v5p-pod-01",
          zone: "us-central1-b",
          tpu_type: "tpu-v5p-slice",
          slice_topology: "2x2x4",
          chip_count: 16,
          interconnect_type: "Optical Circuit Switch (OCS)",
          models_serving: ["google/medlm-large", "meta-llama/Llama-3.3-70B-Instruct"],
          utilization_pct: 86.2,
        },
      ],
    },
    vertex_ai_integration: {
      enabled: true,
      endpoints_active: 4,
      model_registry_synced: true,
      features: [
        "Zero-Downtime Automated Canary Splitting",
        "Dedicated MachineSpec Hardware Auto-Provisioning",
        "Cloud Monitoring & Duty-Cycle Scaling",
        "Native BigQuery Export Streaming",
      ],
    },
    bigquery_telemetry: {
      dataset_id: "modelforge_telemetry",
      table_name: "inference_events",
      partitioning: "DAY(event_timestamp)",
      clustering: ["model_id", "runtime", "accelerator"],
      streaming_inserts: "ACTIVE",
    },
    agentic_interoperability: {
      mcp_server: {
        status: "RUNNING",
        protocol_version: "2024-11-05",
        tools_registered: 13,
        google_tools: [
          "get_google_tpu_topology",
          "export_vertex_manifest",
          "apply_hot_patch_action",
          "export_bigquery_telemetry_schema",
        ],
      },
      google_genai_sdk: {
        compatible: true,
        supported_models: ["gemini-2.0-flash", "gemini-2.0-pro", "gemini-1.5-pro"],
        function_declarations_endpoint: "/api/v1/control/google-cloud/declarations",
      },
      vertex_agent_builder: {
        extension_spec_version: "OpenAPI 3.0.3",
        status: "READY",
      },
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "calculate_tpu_topology";

    if (action === "calculate_tpu_topology") {
      const modelId = body.model_id || "google/gemma-2-27b-it";
      const tpuGen = body.tpu_generation || "tpu-v5p";
      const contextLength = body.context_length || 8192;
      const concurrency = body.target_concurrency || 16;

      let chipCount = 4;
      let topology = "2x2x1";
      let vramPerChip = 95.0;
      let iciBw = 4800;

      if (tpuGen === "tpu-v6e") {
        vramPerChip = 32.0;
        iciBw = 3200;
        chipCount = 8;
        topology = "2x2x2";
      } else if (tpuGen === "tpu-v5e") {
        vramPerChip = 16.0;
        iciBw = 1600;
        chipCount = 8;
        topology = "2x4";
      }

      return NextResponse.json({
        model_id: modelId,
        tpu_generation: tpuGen,
        calculated_topology: {
          slice_topology: topology,
          chip_count: chipCount,
          tensor_parallel_size: chipCount,
          interconnect: "Optical Circuit Switch (ICI OCS)",
          bisection_bandwidth_gb_s: iciBw,
          total_hbm_capacity_gb: chipCount * vramPerChip,
        },
        performance_projection: {
          expected_throughput_tps: Math.round(180 * (chipCount / 4)),
          expected_p95_ttft_ms: Math.round(110 + (contextLength / 1024) * 12),
          estimated_tpot_ms: 12.5,
        },
        gke_manifest: {
          node_selector: {
            "cloud.google.com/gke-tpu-accelerator": `${tpuGen}-slice`,
            "cloud.google.com/gke-tpu-topology": topology,
          },
        },
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid request" }, { status: 500 });
  }
}
