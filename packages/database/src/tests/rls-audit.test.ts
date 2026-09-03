import { test, describe } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { dataLayer } from "../index";

describe("Database Security & Row Level Security (RLS) Audit", () => {
  const migrationsDir = path.resolve(__dirname, "../../../supabase/migrations");

  test("SECURITY: All PostgreSQL tables have RLS enabled and tenant isolation policies", () => {
    if (!fs.existsSync(migrationsDir)) {
      // In bundled dist or container, ensure directory or fallback exists
      return;
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"));

    assert.ok(migrationFiles.length > 0, "Migration files must exist");

    for (const file of migrationFiles) {
      const content = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

      // Find all CREATE TABLE statements
      const tableMatches = Array.from(
        content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi)
      );

      for (const match of tableMatches) {
        const tableName = match[1];
        if (!tableName) continue;

        // Verify ALTER TABLE ... ENABLE ROW LEVEL SECURITY exists
        const rlsRegex = new RegExp(
          `ALTER\\s+TABLE\\s+(?:public\\.)?${tableName}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
          "i"
        );
        assert.ok(
          rlsRegex.test(content),
          `Table '${tableName}' in ${file} MUST have Row Level Security enabled (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)`
        );

        // Verify Tenant Isolation Policy exists
        const policyRegex = new RegExp(
          `CREATE\\s+POLICY\\s+["']?[a-zA-Z0-9_]+["']?\\s+ON\\s+(?:public\\.)?${tableName}\\s+FOR\\s+ALL\\s+USING\\s*\\(\\s*is_org_member\\s*\\(\\s*organization_id\\s*\\)\\s*\\)`,
          "i"
        );
        assert.ok(
          policyRegex.test(content),
          `Table '${tableName}' in ${file} MUST have a tenant isolation policy using is_org_member(organization_id)`
        );
      }
    }
  });

  test("SECURITY: DataLayer tenant isolation partitions data cleanly", () => {
    const orgAlpha = "org_enterprise_alpha";
    const orgBeta = "org_competitor_beta";

    // Create resources in Org Alpha
    dataLayer.createOptimizationAction({
      action_id: "act-alpha-1111-2222-3333-444444444444",
      organization_id: orgAlpha,
      deployment_id: "dep-alpha-1111-2222-3333-444444444444",
      project_id: "default",
      action_type: "change_runtime",
      execution_mode: "advisory",
      current_spec: {
        model: "Qwen/Qwen2.5-32B-Instruct",
        revision: "main",
        runtime: "vllm",
        runtime_version: "0.6.2",
        deployment_target: "kubernetes",
        precision: "fp8",
        accelerator: "NVIDIA-L40S",
        accelerator_count: 2,
        replicas: 2,
        tensor_parallelism: 2,
        pipeline_parallelism: 1,
        regions: ["us-east-1"],
        routing: { strategy: "canary", canary_traffic_pct: 0 },
        health_checks: { readiness_path: "/ready", liveness_path: "/live", initial_delay_seconds: 30, timeout_seconds: 5 },
        slo: { max_p95_ttft_ms: 50, max_mean_tpot_ms: 20, min_throughput_tok_s: 40, max_cost_per_hour_usd: 5.0 },
        version: 1,
      },
      target_spec: {
        model: "Qwen/Qwen2.5-32B-Instruct",
        revision: "main",
        runtime: "tensorrt-llm",
        runtime_version: "0.15.0",
        deployment_target: "kubernetes",
        precision: "fp8",
        accelerator: "NVIDIA-L40S",
        accelerator_count: 2,
        replicas: 2,
        tensor_parallelism: 2,
        pipeline_parallelism: 1,
        regions: ["us-east-1"],
        routing: { strategy: "canary", canary_traffic_pct: 10 },
        health_checks: { readiness_path: "/ready", liveness_path: "/live", initial_delay_seconds: 30, timeout_seconds: 5 },
        slo: { max_p95_ttft_ms: 30, max_mean_tpot_ms: 15, min_throughput_tok_s: 70, max_cost_per_hour_usd: 2.5 },
        version: 2,
      },
      reason: "Software lift optimization",
      evidence: { source_benchmark_ids: [], confidence_score: 95, is_predicted: false },
      policy_evaluation: { passed: true, mode_applied: "advisory", checks: [] },
      estimated_cost_delta_usd_month: -2000,
      estimated_p95_latency_delta_pct: -40,
      estimated_capacity_delta_pct: 50,
      risk: {
        level: "low",
        score: 20,
        reasons: [],
        dimensions: { model_change: false, runtime_change: true, hardware_change: false, topology_change: false, blast_radius_pct: 10, rollback_difficulty: "easy" },
      },
      blast_radius: { max_traffic_pct: 10, affected_gpus: 2, affected_workload: "qwen" },
      rollback_plan: {
        rollback_id: "rol-1",
        source_deployment_id: "dep-alpha-1111-2222-3333-444444444444",
        target_stable_spec: {
          model: "Qwen/Qwen2.5-32B-Instruct",
          revision: "main",
          runtime: "vllm",
          runtime_version: "0.6.2",
          deployment_target: "kubernetes",
          precision: "fp8",
          accelerator: "NVIDIA-L40S",
          accelerator_count: 2,
          replicas: 2,
          tensor_parallelism: 2,
          pipeline_parallelism: 1,
          regions: ["us-east-1"],
          routing: { strategy: "canary", canary_traffic_pct: 0 },
          health_checks: { readiness_path: "/ready", liveness_path: "/live", initial_delay_seconds: 30, timeout_seconds: 5 },
          slo: { max_p95_ttft_ms: 50, max_mean_tpot_ms: 20, min_throughput_tok_s: 40, max_cost_per_hour_usd: 5.0 },
          version: 1,
        },
        required_resources: { accelerator: "NVIDIA-L40S", device_count: 2, replicas: 2 },
        estimated_rollback_duration_s: 30,
        known_risks: [],
        rollback_actions: ["revert router"],
        validation_checks: ["health check"],
      },
      status: "planned",
      action_hash: "mockhash123",
      created_at: new Date().toISOString(),
      version: 1,
    });

    // Query from Org Alpha
    const alphaActions = dataLayer.listOptimizationActions(orgAlpha);
    assert.ok(alphaActions.some((a) => a.organization_id === orgAlpha));

    // Query from Org Beta: Org Beta MUST NOT see Org Alpha's action
    const betaActions = dataLayer.listOptimizationActions(orgBeta);
    assert.equal(betaActions.some((a) => a.organization_id === orgAlpha), false);

    // Audit logs isolation
    const alphaLogs = dataLayer.listControlAuditLogs(orgAlpha);
    assert.ok(alphaLogs.length > 0);
    const betaLogs = dataLayer.listControlAuditLogs(orgBeta);
    assert.equal(betaLogs.some((l) => l.organization_id === orgAlpha), false);
  });
});
