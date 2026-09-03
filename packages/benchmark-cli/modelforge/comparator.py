"""Side-by-side benchmark result comparison and delta analysis."""

import json
from pathlib import Path

from rich.console import Console
from rich.table import Table

from modelforge.schema import OpenComputeBenchRecord


def compare_benchmarks(file1: Path, file2: Path, console: Console) -> None:
    """Renders a comparative side-by-side table between two benchmark results."""
    with open(file1, encoding="utf-8") as f:
        data1 = json.load(f)
    with open(file2, encoding="utf-8") as f:
        data2 = json.load(f)

    b1 = OpenComputeBenchRecord.model_validate(data1)
    b2 = OpenComputeBenchRecord.model_validate(data2)

    table = Table(
        title=f"Benchmark Comparison: {file1.name} vs {file2.name}", show_lines=True
    )
    table.add_column("Dimension", style="cyan", width=22)
    table.add_column(f"Run A ({b1.benchmark_id[:8]})", style="white", width=28)
    table.add_column(f"Run B ({b2.benchmark_id[:8]})", style="white", width=28)
    table.add_column("Delta / Difference", style="bold", width=22)

    # Model & Config
    table.add_row(
        "Model Repository",
        b1.model.repository,
        b2.model.repository,
        "=" if b1.model.repository == b2.model.repository else "Different",
    )
    table.add_row(
        "Precision",
        b1.precision.type,
        b2.precision.type,
        "=" if b1.precision.type == b2.precision.type else "Different",
    )
    table.add_row(
        "Runtime",
        f"{b1.runtime.name} {b1.runtime.version}",
        f"{b2.runtime.name} {b2.runtime.version}",
        "=" if b1.runtime.name == b2.runtime.name else "Different",
    )
    table.add_row(
        "Hardware",
        f"{b1.hardware.device} ×{b1.hardware.count}",
        f"{b2.hardware.device} ×{b2.hardware.count}",
        "=" if b1.hardware.device == b2.hardware.device else "Different",
    )

    # Metrics
    tps1, tps2 = b1.metrics.tokens_per_second, b2.metrics.tokens_per_second
    tps_delta = round(((tps2 - tps1) / tps1) * 100, 1) if tps1 > 0 else 0
    tps_color = "green" if tps_delta > 0 else "red"
    table.add_row(
        "Tokens / Second",
        f"{tps1:.1f} tok/s",
        f"{tps2:.1f} tok/s",
        f"[{tps_color}]{tps_delta:+.1f}%[/]",
    )

    ttft1, ttft2 = b1.metrics.ttft_ms.p50_ms, b2.metrics.ttft_ms.p50_ms
    ttft_delta = round(((ttft2 - ttft1) / ttft1) * 100, 1) if ttft1 > 0 else 0
    ttft_color = "green" if ttft_delta < 0 else "red"  # lower is better
    table.add_row(
        "P50 TTFT",
        f"{ttft1:.1f} ms",
        f"{ttft2:.1f} ms",
        f"[{ttft_color}]{ttft_delta:+.1f}%[/]",
    )

    tpot1, tpot2 = b1.metrics.tpot_ms.p50_ms, b2.metrics.tpot_ms.p50_ms
    tpot_delta = round(((tpot2 - tpot1) / tpot1) * 100, 1) if tpot1 > 0 else 0
    tpot_color = "green" if tpot_delta < 0 else "red"  # lower is better
    table.add_row(
        "P50 TPOT",
        f"{tpot1:.1f} ms",
        f"{tpot2:.1f} ms",
        f"[{tpot_color}]{tpot_delta:+.1f}%[/]",
    )

    vram1_gb = round(b1.metrics.peak_vram_bytes / (1024**3), 2)
    vram2_gb = round(b2.metrics.peak_vram_bytes / (1024**3), 2)
    vram_delta = round(vram2_gb - vram1_gb, 2)
    vram_color = "green" if vram_delta <= 0 else "yellow"
    table.add_row(
        "Peak VRAM",
        f"{vram1_gb} GB",
        f"{vram2_gb} GB",
        f"[{vram_color}]{vram_delta:+.2f} GB[/]",
    )

    table.add_row(
        "Verification Status",
        b1.verification.status,
        b2.verification.status,
        "=" if b1.verification.status == b2.verification.status else "Different",
    )

    console.print(table)
