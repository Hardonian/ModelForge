"""Integration tests for Typer CLI commands."""

import json
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

    runner.invoke(app, ["benchmark", "Qwen/Qwen2.5-32B-Instruct", "--simulate", "--output", str(f1)])
    runner.invoke(app, ["benchmark", "meta-llama/Llama-3.3-70B-Instruct", "--simulate", "--output", str(f2)])

    res = runner.invoke(app, ["compare", str(f1), str(f2)])
    assert res.exit_code == 0
    assert "Benchmark Comparison" in res.stdout
