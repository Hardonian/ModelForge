"""Model Context Protocol (MCP) Contract and SDK Unit Tests."""

import json

from modelforge.client import ModelForgeClient
from modelforge.mcp_server import process_message


def test_mcp_initialize():
    req = {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}
    resp = process_message(req)
    assert resp is not None
    assert resp["id"] == 1
    assert resp["result"]["serverInfo"]["name"] == "modelforge-mcp"
    assert resp["result"]["serverInfo"]["version"] == "1.0.0"


def test_mcp_tools_list():
    req = {"jsonrpc": "2.0", "id": 2, "method": "tools/list"}
    resp = process_message(req)
    assert resp is not None
    tools = resp["result"]["tools"]
    tool_names = [t["name"] for t in tools]

    expected_v1_tools = [
        "inspect_model",
        "get_compute_passport",
        "compile_slo",
        "optimize_workload",
        "compare_configurations",
        "get_benchmark",
        "reproduce_benchmark_spec",
        "generate_deployment_plan",
        "check_performance_regression",
        "get_google_tpu_topology",
        "export_vertex_manifest",
        "apply_hot_patch_action",
        "export_bigquery_telemetry_schema",
    ]
    for exp in expected_v1_tools:
        assert exp in tool_names, f"Expected MCP tool {exp} not found in tools/list"


def test_mcp_inspect_model():
    req = {
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/call",
        "params": {"name": "inspect_model", "arguments": {"model_id": "Qwen/Qwen2.5-32B-Instruct", "revision": "main"}},
    }
    resp = process_message(req)
    assert resp is not None
    assert resp["result"]["isError"] is False
    content = json.loads(resp["result"]["content"][0]["text"])
    assert content["model_id"] == "Qwen/Qwen2.5-32B-Instruct"
    assert content["parameters_billions"] == 32.5
    assert content["memory_footprint_gb"]["fp8"] == 32.5
    assert content["provenance"] == "MEASURED"


def test_mcp_get_compute_passport():
    req = {
        "jsonrpc": "2.0",
        "id": 4,
        "method": "tools/call",
        "params": {"name": "get_compute_passport", "arguments": {"model_id": "meta-llama/Llama-3.3-70B-Instruct"}},
    }
    resp = process_message(req)
    assert resp is not None
    assert resp["result"]["isError"] is False
    passport = json.loads(resp["result"]["content"][0]["text"])
    assert passport["model_id"] == "meta-llama/Llama-3.3-70B-Instruct"
    assert passport["confidence"]["score"] >= 90
    assert "vllm" in passport["compatibility"]
    assert passport["compatibility"]["vllm"]["status"] == "SUPPORTED"


def test_mcp_compile_slo():
    req = {
        "jsonrpc": "2.0",
        "id": 5,
        "method": "tools/call",
        "params": {
            "name": "compile_slo",
            "arguments": {
                "model_id": "Qwen/Qwen2.5-32B-Instruct",
                "task_type": "rag",
                "target_concurrency": 16,
                "max_p95_ttft_ms": 300.0,
            },
        },
    }
    resp = process_message(req)
    assert resp is not None
    assert resp["result"]["isError"] is False
    plan = json.loads(resp["result"]["content"][0]["text"])
    assert len(plan["ranked_candidates"]) > 0
    assert plan["ranked_candidates"][0]["slo_compliance_percent"] >= 90.0


def test_mcp_check_performance_regression():
    # Test case: Pass
    req_pass = {
        "jsonrpc": "2.0",
        "id": 6,
        "method": "tools/call",
        "params": {
            "name": "check_performance_regression",
            "arguments": {
                "baseline_tps": 100.0,
                "current_tps": 98.0,  # 2% drop <= 5% threshold
                "baseline_ttft_ms": 200.0,
                "current_ttft_ms": 208.0,  # 4% increase <= 10% threshold
            },
        },
    }
    resp_pass = process_message(req_pass)
    result_pass = json.loads(resp_pass["result"]["content"][0]["text"])
    assert result_pass["gate_passed"] is True
    assert result_pass["verdict"] == "PASS"

    # Test case: Fail on throughput drop
    req_fail = {
        "jsonrpc": "2.0",
        "id": 7,
        "method": "tools/call",
        "params": {
            "name": "check_performance_regression",
            "arguments": {
                "baseline_tps": 100.0,
                "current_tps": 90.0,  # 10% drop > 5% threshold
                "baseline_ttft_ms": 200.0,
                "current_ttft_ms": 205.0,
            },
        },
    }
    resp_fail = process_message(req_fail)
    result_fail = json.loads(resp_fail["result"]["content"][0]["text"])
    assert result_fail["gate_passed"] is False
    assert result_fail["verdict"] == "FAIL"


def test_python_client_sdk_instantiation():
    client = ModelForgeClient(base_url="http://localhost:3000/api/v1", api_key="mf_live_test")
    assert client.base_url == "http://localhost:3000/api/v1"
    assert client.api_key == "mf_live_test"
    headers = client._headers()
    assert headers["Authorization"] == "Bearer mf_live_test"
    assert "ModelForge-Python-SDK/1.0.0" in headers["User-Agent"]


def test_mcp_get_google_tpu_topology():
    req = {
        "jsonrpc": "2.0",
        "id": 8,
        "method": "tools/call",
        "params": {
            "name": "get_google_tpu_topology",
            "arguments": {
                "model_id": "google/gemma-2-27b-it",
                "tpu_generation": "tpu-v5p",
                "context_length": 8192,
                "target_concurrency": 16,
            },
        },
    }
    resp = process_message(req)
    assert resp is not None
    assert resp["result"]["isError"] is False
    res = json.loads(resp["result"]["content"][0]["text"])
    assert res["model_id"] == "google/gemma-2-27b-it"
    assert res["tpu_generation"] == "tpu-v5p"
    assert "slice_topology" in res["calculated_topology"]
    assert res["calculated_topology"]["interconnect"] == "Optical Circuit Switch (ICI OCS)"
    assert res["gke_node_selector"]["cloud.google.com/gke-tpu-accelerator"] == "tpu-v5p-slice"
    assert res["performance_projection"]["expected_throughput_tps"] > 0


def test_mcp_export_vertex_manifest():
    req = {
        "jsonrpc": "2.0",
        "id": 9,
        "method": "tools/call",
        "params": {
            "name": "export_vertex_manifest",
            "arguments": {
                "model_id": "google/gemma-2-27b-it",
                "accelerator_type": "TPU_V5P",
                "accelerator_count": 4,
            },
        },
    }
    resp = process_message(req)
    assert resp is not None
    assert resp["result"]["isError"] is False
    res = json.loads(resp["result"]["content"][0]["text"])
    assert "manifest_content" in res
    assert "aiplatform.googleapis.com" in res["manifest_content"]
    assert "gcloud ai endpoints deploy-model" in res["gcloud_command"]
    assert "ct5p-hightpu-4t" in res["machine_type"]


def test_mcp_apply_hot_patch_action():
    req = {
        "jsonrpc": "2.0",
        "id": 10,
        "method": "tools/call",
        "params": {
            "name": "apply_hot_patch_action",
            "arguments": {
                "deployment_id": "dep-live-tpu-1",
                "patch_type": "quantize_kv_cache",
                "target_precision": "fp8",
            },
        },
    }
    resp = process_message(req)
    assert resp is not None
    assert resp["result"]["isError"] is False
    res = json.loads(resp["result"]["content"][0]["text"])
    assert res["status"] == "applied"
    assert res["downtime_ms"] == 0.0
    assert res["rollback_ready"] is True
    assert res["rollback_token"].startswith("rbk-")


def test_mcp_export_bigquery_telemetry_schema():
    req = {
        "jsonrpc": "2.0",
        "id": 11,
        "method": "tools/call",
        "params": {
            "name": "export_bigquery_telemetry_schema",
            "arguments": {"dataset_id": "prod_analytics", "retention_days": 60},
        },
    }
    resp = process_message(req)
    assert resp is not None
    assert resp["result"]["isError"] is False
    res = json.loads(resp["result"]["content"][0]["text"])
    assert res["dataset_id"] == "prod_analytics"
    assert "CREATE SCHEMA IF NOT EXISTS `prod_analytics`" in res["ddl_schema"]
    assert "PARTITION BY DATE(event_timestamp)" in res["ddl_schema"]


def test_google_genai_agent_interoperability():
    from modelforge.google_genai_agent import (
        get_genai_function_declarations,
        export_vertex_extension_spec,
        dispatch_genai_tool_call,
    )

    # Test FunctionDeclarations format for google.genai
    decls = get_genai_function_declarations()
    assert len(decls) >= 13
    names = [d["name"] for d in decls]
    assert "get_google_tpu_topology" in names
    assert "export_vertex_manifest" in names

    # Test Vertex Extension OpenAPI 3.0.3 spec
    spec = export_vertex_extension_spec()
    assert spec["openapi"] == "3.0.3"
    assert "/tools/get_google_tpu_topology" in spec["paths"]
    assert "/tools/export_vertex_manifest" in spec["paths"]

    # Test dispatch
    raw_res = dispatch_genai_tool_call("inspect_model", {"model_id": "google/gemma-2-27b-it"})
    parsed = json.loads(raw_res)
    assert parsed["model_id"] == "google/gemma-2-27b-it"
    assert parsed["provenance"] == "MEASURED"
