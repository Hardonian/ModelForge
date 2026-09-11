"""Tests for Phase 6 2026 Planetary Scale & Autonomous Mesh features."""

import pytest
from typer.testing import CliRunner

from modelforge.cli import app
from modelforge.distributed import MultiNodeDistributedHarness
from modelforge.hf_sync import HuggingFaceSyncManager
from modelforge.smart_router import SmartRouterClient
from modelforge.speculative import SpeculativeProfiler
from modelforge.worker_network import WorkerNetworkManager

runner = CliRunner()


def test_distributed_harness_profiling():
    harness = MultiNodeDistributedHarness(nodes_count=4, gpus_per_node=8, fabric="infiniband_ndr")
    topo = harness.profile_network_topology()

    assert topo["nodes_count"] == 4
    assert topo["total_gpus"] == 32
    assert topo["cross_node_bandwidth_gbps"] == 400.0
    assert topo["allreduce_busbw_gbps"] > 300.0
    assert topo["recommended_tp_max"] == 8
    assert topo["recommended_pp_min"] == 4

    result = harness.run_distributed_benchmark()
    assert result["scaling_efficiency_pct"] > 60.0
    assert result["effective_throughput_tok_s"] > 1000.0


def test_speculative_profiler():
    p = SpeculativeProfiler.profile("meta-llama/Llama-3-70B", "meta-llama/Llama-3-8B", lookahead_gamma=5)
    assert p["target_model"] == "meta-llama/Llama-3-70B"
    assert p["empirical_acceptance_rate"] >= 0.70
    assert p["empirical_speedup"] > 1.4
    assert p["draft_memory_overhead_mb"] > 0

    sweep = SpeculativeProfiler.sweep("meta-llama/Llama-3-70B")
    assert len(sweep) == 10
    assert sweep[0]["gamma"] == 1


def test_hf_sync_manager():
    mgr = HuggingFaceSyncManager()
    payload = mgr.generate_webhook_payload("google/gemma-2-9b", "commit-sha-123")
    assert payload["repo_id"] == "google/gemma-2-9b"
    assert payload["commit_sha"] == "commit-sha-123"

    sig = mgr.sign_payload(payload)
    assert sig.startswith("sha256=")

    sync_res = mgr.trigger_sync("google/gemma-2-9b", "commit-sha-123")
    assert sync_res["received"] is True
    assert sync_res["status"] == "synced"


def test_worker_network_and_proof_of_execution():
    mgr = WorkerNetworkManager()
    reg = mgr.register_worker("nvidia-h100-80gb", 80)
    assert reg["status"] == "registered"

    chal = mgr.request_challenge("nvidia-h100-80gb")
    assert chal["matrix_dim_m"] == 8192
    assert chal["expected_min_duration_ms"] > 0

    proof = mgr.solve_challenge(chal)
    assert proof["challenge_id"] == chal["challenge_id"]
    assert proof["execution_duration_ms"] > 0

    attest = mgr.verify_attestation(chal, proof)
    assert attest["verified"] is True
    assert attest["confidence_score"] == 0.99


def test_smart_router_client():
    client = SmartRouterClient()
    prompt = "System: Code assistant prompt that will be cached across turns.\nWrite a function."

    r1 = client.route_request(prompt)
    assert r1["cache_hit"] is False
    assert r1["routing_overhead_ms"] < 10.0

    r2 = client.route_request(prompt)
    assert r2["cache_hit"] is True
    assert r2["selected_worker_id"] == r1["selected_worker_id"]

    drain = client.trigger_spot_drain(r1["selected_worker_id"])
    assert drain["status"] == "draining"
    assert drain["drain_completed"] is True


def test_cli_phase6_commands():
    # Distributed CLI
    res = runner.invoke(app, ["distributed", "--nodes", "2", "--gpus-per-node", "8"])
    assert res.exit_code == 0
    assert "Multi-Node Distributed Topology Benchmark" in res.stdout

    # Speculative Profiler CLI
    res = runner.invoke(app, ["profile", "speculative", "--target", "meta-llama/Llama-3-70B"])
    assert res.exit_code == 0
    assert "Speculative Decoding Profiler Report" in res.stdout

    # HF Sync CLI
    res = runner.invoke(app, ["hf-sync", "google/gemma-2-9b"])
    assert res.exit_code == 0
    assert "Real-time Hugging Face Sync completed" in res.stdout

    # Network CLI
    res = runner.invoke(app, ["network", "register"])
    assert res.exit_code == 0
    assert "Worker registered" in res.stdout

    res = runner.invoke(app, ["network", "prove"])
    assert res.exit_code == 0
    assert "Cryptographic Proof-of-Execution Verified" in res.stdout

    # Router CLI
    res = runner.invoke(app, ["router", "test"])
    assert res.exit_code == 0
    assert "Request 1 Dispatched" in res.stdout
