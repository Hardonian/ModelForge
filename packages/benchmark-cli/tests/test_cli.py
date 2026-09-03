"""Integration tests for Typer CLI commands."""

from typer.testing import CliRunner

from modelforge.cli import app

runner = CliRunner()


def test_cli_doctor():
    result = runner.invoke(app, ["doctor"])
    assert result.exit_code in [0, 1]
    assert "ModelForge System Health" in result.stdout


def test_cli_inspect():
    result = runner.invoke(app, ["inspect"])
    assert result.exit_code == 0
    assert "Operating System" in result.stdout
    assert "System RAM" in result.stdout


def test_cli_hardware():
    result = runner.invoke(app, ["hardware"])
    assert result.exit_code == 0
    assert "Detected Accelerator Devices" in result.stdout


def test_cli_model_inspect():
    result = runner.invoke(app, ["model", "inspect", "Qwen/Qwen2.5-32B-Instruct"])
    assert result.exit_code == 0
    assert "Memory Footprint by Precision" in result.stdout
    assert "FP8" in result.stdout


def test_cli_benchmark_and_validate(tmp_path):
    out_file = tmp_path / "result.json"
    result = runner.invoke(
        app,
        [
            "benchmark",
            "Qwen/Qwen2.5-32B-Instruct",
            "--simulate",
            "--output",
            str(out_file),
        ],
    )
    assert result.exit_code == 0
    assert out_file.exists()

    # Validate output
    val_result = runner.invoke(app, ["validate", str(out_file)])
    assert val_result.exit_code == 0
    assert "Schema & Hash Integrity Verified" in val_result.stdout


def test_cli_compare(tmp_path):
    f1 = tmp_path / "run1.json"
    f2 = tmp_path / "run2.json"

    runner.invoke(
        app,
        ["benchmark", "Qwen/Qwen2.5-32B-Instruct", "--simulate", "--output", str(f1)],
    )
    runner.invoke(
        app,
        [
            "benchmark",
            "meta-llama/Llama-3.3-70B-Instruct",
            "--simulate",
            "--output",
            str(f2),
        ],
    )

    res = runner.invoke(app, ["compare", str(f1), str(f2)])
    assert res.exit_code == 0
    assert "Benchmark Comparison" in res.stdout


def test_cli_passport():
    res = runner.invoke(app, ["passport", "Qwen/Qwen2.5-32B-Instruct"])
    assert res.exit_code == 0
    assert "ModelForge Compute Passport" in res.stdout
    assert "NVIDIA Dynamo" in res.stdout
    assert "NVIDIA NIM" in res.stdout


def test_cli_plan_and_deploy_plan(tmp_path):
    workload_file = tmp_path / "workload.yaml"
    workload_file.write_text(
        """model: Qwen/Qwen2.5-32B-Instruct
revision: main
workload:
  type: rag
  concurrency: 16
slo:
  p95_ttft_ms: 500
"""
    )

    # Test plan
    res_plan = runner.invoke(app, ["plan", str(workload_file)])
    assert res_plan.exit_code == 0
    assert "Ranked Deployment Configurations" in res_plan.stdout

    # Test deploy-plan for dynamo
    out_dir = tmp_path / "plan-output"
    res_deploy = runner.invoke(
        app,
        ["deploy-plan", str(workload_file), "--target", "dynamo", "--out-dir", str(out_dir)],
    )
    assert res_deploy.exit_code == 0
    assert (out_dir / "plan.json").exists()
    assert (out_dir / "dynamo-config.yaml").exists()
    assert (out_dir / "deployment-notes.md").exists()


def test_cli_benchmark_matrix():
    res = runner.invoke(app, ["benchmark-matrix", "Qwen/Qwen2.5-32B-Instruct", "--hardware", "l40s,h100"])
    assert res.exit_code == 0
    assert "Benchmark Matrix Execution Plan" in res.stdout
    assert "Total Benchmark Runs" in res.stdout


def test_cli_badge():
    res = runner.invoke(app, ["badge", "Qwen/Qwen2.5-32B-Instruct"])
    assert res.exit_code == 0
    assert "Compute Passport" in res.stdout
    assert "ModelFit" in res.stdout


def test_cli_ci_check(tmp_path):
    ci_file = tmp_path / ".modelforge.yml"
    ci_file.write_text(
        """version: 1
model:
  repo: Qwen/Qwen2.5-32B-Instruct
thresholds:
  throughput_regression_percent: 5
  ttft_regression_percent: 10
  vram_regression_percent: 8
"""
    )
    res = runner.invoke(app, ["ci", "check", "--config", str(ci_file)])
    assert res.exit_code == 0
    assert "Performance Regression Evaluation" in res.stdout
    assert "Performance CI Passed" in res.stdout

