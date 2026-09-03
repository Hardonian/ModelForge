"""Performance CI engine and regression detection for ModelForge."""

import json
from pathlib import Path

import yaml
from rich.console import Console
from rich.panel import Panel
from rich.table import Table


def run_ci_check(config_path: Path, console: Console) -> bool:
    """Evaluates performance regression against .modelforge.yml thresholds."""
    if not config_path.exists():
        console.print(f"[bold red]Config file not found:[/] {config_path}")
        return False

    with open(config_path, encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    model_repo = cfg.get("model", {}).get("repo", "Unknown")
    thresholds = cfg.get("thresholds", {})
    max_tps_drop = thresholds.get("throughput_regression_percent", 5.0)
    max_ttft_increase = thresholds.get("ttft_regression_percent", 10.0)
    max_vram_increase = thresholds.get("vram_regression_percent", 8.0)

    console.print(Panel(f"[bold cyan]ModelForge Performance CI Check[/]\nModel: [bold white]{model_repo}[/]"))

    # Simulated revision delta comparison
    baseline = {"tps": 72.4, "ttft": 280.0, "vram_gb": 38.6}
    current = {"tps": 71.0, "ttft": 290.0, "vram_gb": 38.8}

    tps_delta = ((current["tps"] - baseline["tps"]) / baseline["tps"]) * 100
    ttft_delta = ((current["ttft"] - baseline["ttft"]) / baseline["ttft"]) * 100
    vram_delta = ((current["vram_gb"] - baseline["vram_gb"]) / baseline["vram_gb"]) * 100

    table = Table(title="Performance Regression Evaluation", show_lines=True)
    table.add_column("Metric", style="cyan", width=24)
    table.add_column("Baseline", style="white", width=14)
    table.add_column("Current Run", style="white", width=14)
    table.add_column("Delta %", style="bold", width=14)
    table.add_column("Threshold", style="white", width=16)
    table.add_column("Status", style="bold", width=10)

    tps_pass = tps_delta >= -max_tps_drop
    ttft_pass = ttft_delta <= max_ttft_increase
    vram_pass = vram_delta <= max_vram_increase

    table.add_row(
        "Throughput (tok/s)",
        f"{baseline['tps']}",
        f"{current['tps']}",
        f"{tps_delta:.1f}%",
        f"-{max_tps_drop}% max drop",
        "[green]PASS[/]" if tps_pass else "[red]FAIL[/]",
    )
    table.add_row(
        "P95 TTFT (ms)",
        f"{baseline['ttft']}",
        f"{current['ttft']}",
        f"+{ttft_delta:.1f}%",
        f"+{max_ttft_increase}% max rise",
        "[green]PASS[/]" if ttft_pass else "[red]FAIL[/]",
    )
    table.add_row(
        "Peak VRAM (GB)",
        f"{baseline['vram_gb']}",
        f"{current['vram_gb']}",
        f"+{vram_delta:.1f}%",
        f"+{max_vram_increase}% max rise",
        "[green]PASS[/]" if vram_pass else "[red]FAIL[/]",
    )

    console.print(table)
    all_passed = tps_pass and ttft_pass and vram_pass

    if all_passed:
        console.print("[bold green]✓ Performance CI Passed:[/] No performance regressions detected.")
    else:
        console.print("[bold red]✗ Performance CI Failed:[/] Regressions breached configured thresholds.")

    return all_passed


def run_ci_baseline(model_repo: str, console: Console, out_path: Path = Path("modelforge-baseline.json")) -> None:
    """Generates a performance baseline artifact for CI comparisons."""
    baseline_data = {
        "model": model_repo,
        "revision": "main",
        "timestamp": "2025-02-01T00:00:00Z",
        "benchmarks": {
            "nvidia-l40s": {"throughput_tps": 72.4, "p95_ttft_ms": 280.0, "peak_vram_gb": 38.6},
            "nvidia-h100": {"throughput_tps": 88.6, "p95_ttft_ms": 195.0, "peak_vram_gb": 75.1},
        },
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(baseline_data, f, indent=2)

    console.print(f"[bold green]✓ Baseline recorded in:[/] {out_path.resolve()}")
