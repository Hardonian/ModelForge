"""Unit tests for Phase 4 CLI subcommands and worker daemon."""

from typer.testing import CliRunner

from modelforge.cli import app
from modelforge.worker_daemon import BenchmarkWorkerDaemon

runner = CliRunner()


def test_cli_predict():
    result = runner.invoke(
        app,
        [
            "predict",
            "--model",
            "Qwen/Qwen2.5-32B-Instruct",
            "--accelerator",
            "NVIDIA L40S",
            "--params",
            "32.5",
        ],
    )
    assert result.exit_code == 0
    assert "PREDICTED" in result.stdout
    assert "Qwen/Qwen2.5-32B-Instruct" in result.stdout
    assert "tok/s" in result.stdout


def test_cli_coverage():
    result = runner.invoke(app, ["coverage"])
    assert result.exit_code == 0
    assert "Benchmark Matrix Coverage Status" in result.stdout
    assert "COVERED" in result.stdout


def test_cli_capacity_plan():
    result = runner.invoke(
        app,
        [
            "capacity-plan",
            "--model",
            "Qwen/Qwen2.5-32B-Instruct",
            "--traffic-growth",
            "50",
        ],
    )
    assert result.exit_code == 0
    assert "Capacity What-If Plan" in result.stdout
    assert "P95 TTFT Latency" in result.stdout


def test_worker_daemon_local():
    daemon = BenchmarkWorkerDaemon(
        worker_id="test-worker-uuid-123",
        token="test-token-abc",
        private_mode=True,
    )
    caps = daemon.register_capabilities(name="test-worker")
    assert caps["id"] == "test-worker-uuid-123"
    assert caps["trust_tier"] == "organization"
    assert caps["capabilities"]["privacy_mode"] == "private"

    # Execute simulated job
    job = {
        "id": "job-test-1",
        "model_repository": "Qwen/Qwen2.5-32B-Instruct",
        "runtime": "simulation",
        "precision": "fp8",
        "workload": {"prompt_tokens": 1024, "generated_tokens": 256, "concurrency": 2},
    }
    record = daemon.execute_job(job)
    assert record["benchmark_id"] is not None
    assert record["metrics"]["tokens_per_second"] > 0
