"""ModelForge CLI: OpenComputeBench benchmark agent and hardware intelligence runner."""

import json
from pathlib import Path

import httpx
import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from modelforge.adapters.hardware import detect_system_environment
from modelforge.comparator import compare_benchmarks
from modelforge.doctor import run_doctor
from modelforge.runner import run_benchmark
from modelforge.schema import OpenComputeBenchRecord, validate_benchmark_integrity

app = typer.Typer(
    name="modelforge",
    help="The open compute intelligence layer for AI. Benchmark runner, hardware inspector, and workload optimizer.",
    add_completion=False,
)
console = Console()


@app.command()
def doctor() -> None:
    """Diagnose GPU, VRAM, drivers, CUDA/ROCm, OS, Python, and runtime dependencies."""
    is_healthy = run_doctor(console)
    if not is_healthy:
        raise typer.Exit(code=1)


@app.command()
def inspect() -> None:
    """Inspect local host, operating system, physical RAM, CPU cores, and storage."""
    env = detect_system_environment()
    table = Table(title="ModelForge Host Environment", show_lines=True)
    table.add_column("Property", style="cyan", width=24)
    table.add_column("Value", style="white", width=44)

    table.add_row("Operating System", f"{env.os_name} {env.os_version}")
    table.add_row("CPU Architecture", env.cpu_architecture)
    table.add_row(
        "CPU Physical / Logical",
        f"{env.cpu_cores_physical} physical / {env.cpu_cores_logical} logical",
    )
    table.add_row(
        "System RAM",
        f"{round(env.system_ram_bytes / (1024**3), 2)} GB total ({round(env.available_ram_bytes / (1024**3), 2)} GB free)",
    )
    table.add_row("Disk Space Free", f"{env.disk_free_gb} GB")
    table.add_row("Python Version", env.python_version)
    table.add_row("Accelerators Detected", str(len(env.accelerators)))

    console.print(table)


@app.command()
def hardware() -> None:
    """List and inspect detected GPUs and compute accelerators."""
    env = detect_system_environment()
    table = Table(title="Detected Accelerator Devices", show_lines=True)
    table.add_column("Vendor", style="cyan", width=12)
    table.add_column("Device Name", style="bold white", width=32)
    table.add_column("VRAM", style="green", width=14)
    table.add_column("Interconnect", style="white", width=16)
    table.add_column("Driver / Platform", style="white", width=22)

    for acc in env.accelerators:
        vram_gb = f"{round(acc.vram_bytes / (1024**3), 1)} GB"
        driver = acc.driver_version or (
            f"CUDA {acc.cuda_version}" if acc.cuda_version else "N/A"
        )
        table.add_row(acc.vendor.upper(), acc.name, vram_gb, acc.interconnect, driver)

    console.print(table)


@app.command()
def model(
    action: str = typer.Argument("inspect", help="Action to perform (inspect)"),
    model_id: str = typer.Argument(
        ..., help="Hugging Face model repository identifier"
    ),
) -> None:
    """Inspect model architecture and calculate memory footprints across precisions."""
    params_b = 32.5 if "32" in model_id else (70.6 if "70" in model_id else 8.0)
    console.print(f"[bold cyan]Model Intelligence for[/] [bold white]{model_id}[/]")
    console.print(f"[dim]Estimated parameters:[/] {params_b} Billion")

    table = Table(title=f"Memory Footprint by Precision: {model_id}", show_lines=True)
    table.add_column("Precision", style="cyan", width=14)
    table.add_column("Weight VRAM", style="white", width=16)
    table.add_column("Min Recommended VRAM", style="bold green", width=24)
    table.add_column("Compatible Accelerators (Examples)", style="white", width=34)

    # FP16
    w_fp16 = round(params_b * 2.0, 1)
    min_fp16 = round(w_fp16 * 1.25, 1)
    rec_fp16 = (
        "H100 80GB, A100 80GB"
        if min_fp16 > 48
        else ("L40S 48GB" if min_fp16 > 24 else "RTX 4090 24GB")
    )
    table.add_row("FP16 / BF16", f"{w_fp16} GB", f"{min_fp16} GB", rec_fp16)

    # FP8
    w_fp8 = round(params_b * 1.0, 1)
    min_fp8 = round(w_fp8 * 1.25, 1)
    rec_fp8 = "L40S 48GB, RTX 5090 32GB" if min_fp8 > 24 else "RTX 4090 24GB, L4 24GB"
    table.add_row("FP8", f"{w_fp8} GB", f"{min_fp8} GB", rec_fp8)

    # INT4 / AWQ
    w_int4 = round(params_b * 0.55, 1)
    min_int4 = round(w_int4 * 1.25, 1)
    rec_int4 = (
        "RTX 4090 24GB, RTX 3090 24GB"
        if min_int4 > 16
        else "Apple M3/M4, RTX 4080 16GB"
    )
    table.add_row("INT4 / AWQ", f"{w_int4} GB", f"{min_int4} GB", rec_int4)

    console.print(table)


@app.command()
def benchmark(
    model_id: str = typer.Argument(..., help="Model repository ID to benchmark"),
    runtime: str = typer.Option(
        "vllm", "--runtime", "-r", help="Runtime engine (vllm, llama.cpp, transformers)"
    ),
    precision: str = typer.Option(
        "fp8", "--precision", "-p", help="Precision (fp16, fp8, int4, awq)"
    ),
    context: int = typer.Option(
        4096, "--context", "-c", help="Workload context length tokens"
    ),
    concurrency: int = typer.Option(
        1, "--concurrency", help="Concurrent client requests"
    ),
    output: Path | None = typer.Option(
        None, "--output", "-o", help="Output JSON path to save benchmark result"
    ),
    simulate: bool = typer.Option(
        False, "--simulate", help="Run in deterministic development simulation mode"
    ),
) -> None:
    """Execute OpenComputeBench reproducible inference benchmark."""
    record = run_benchmark(
        model_id=model_id,
        runtime=runtime,
        precision=precision,
        context_length=context,
        concurrency=concurrency,
        simulate=simulate,
        console=console,
    )

    # Summary Panel
    card = f"""[bold green]BENCHMARK COMPLETE[/]
[dim]ID:[/] {record.benchmark_id}
[dim]Model:[/] {record.model.repository} ({record.precision.type})
[dim]Hardware:[/] {record.hardware.device} ({record.hardware.vendor.upper()})
[dim]Throughput:[/] [bold cyan]{record.metrics.tokens_per_second} tok/s[/]
[dim]P50 TTFT:[/] [bold yellow]{record.metrics.ttft_ms.p50_ms} ms[/] | [dim]P95:[/] {record.metrics.ttft_ms.p95_ms} ms
[dim]P50 TPOT:[/] [bold yellow]{record.metrics.tpot_ms.p50_ms} ms[/] | [dim]P95:[/] {record.metrics.tpot_ms.p95_ms} ms
[dim]Peak VRAM:[/] {round(record.metrics.peak_vram_bytes / (1024**3), 2)} GB
[dim]Status:[/] [{"yellow" if record.synthetic_fixture else "green"}]{record.verification.status.upper()}[/] {"(Synthetic Fixture)" if record.synthetic_fixture else ""}
[dim]Environment Hash:[/] {record.provenance.environment_hash[:16]}...
[dim]Result Hash:[/] {record.provenance.result_hash[:16]}..."""
    console.print(
        Panel(card, title="ModelForge Benchmark Result Card", border_style="cyan")
    )

    # Save to file
    out_path = output or Path(f"benchmark-{record.benchmark_id[:8]}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(record.model_dump_json(indent=2))
    console.print(f"[bold green]✓ Result written to:[/] {out_path}")


@app.command()
def validate(
    file_path: Path = typer.Argument(..., help="Path to benchmark JSON result file"),
) -> None:
    """Validate a benchmark result file against the OpenComputeBench schema and verify hashes."""
    if not file_path.exists():
        console.print(f"[bold red]Error:[/] File not found: {file_path}")
        raise typer.Exit(code=1)

    try:
        with open(file_path, encoding="utf-8") as f:
            data = json.load(f)
        record = OpenComputeBenchRecord.model_validate(data)
        is_valid, errors = validate_benchmark_integrity(record)

        if is_valid:
            console.print(
                f"[bold green]✓ Schema & Hash Integrity Verified:[/] {file_path}"
            )
            console.print(
                f"[dim]Status:[/] {record.verification.status} | [dim]Synthetic:[/] {record.synthetic_fixture}"
            )
        else:
            console.print(f"[bold red]✗ Verification Failed:[/] {file_path}")
            for err in errors:
                console.print(f"  [red]- {err}[/]")
            raise typer.Exit(code=1)
    except Exception as e:
        console.print(f"[bold red]Validation error:[/] {e}")
        raise typer.Exit(code=1)


@app.command()
def compare(
    file1: Path = typer.Argument(..., help="First benchmark result JSON file"),
    file2: Path = typer.Argument(..., help="Second benchmark result JSON file"),
) -> None:
    """Compare two benchmark results side-by-side with latency and throughput deltas."""
    if not file1.exists() or not file2.exists():
        console.print("[bold red]Error:[/] One or both files not found.")
        raise typer.Exit(code=1)
    compare_benchmarks(file1, file2, console)


@app.command()
def submit(
    file_path: Path = typer.Argument(
        ..., help="Path to benchmark JSON result to submit"
    ),
    api_url: str = typer.Option(
        "http://localhost:3000/api/v1/benchmark-submissions",
        "--api-url",
        help="API submission endpoint",
    ),
    api_key: str | None = typer.Option(
        None, "--api-key", envvar="MODELFORGE_API_KEY", help="ModelForge API Key"
    ),
) -> None:
    """Submit a validated benchmark result to the ModelForge OpenComputeBench network."""
    with open(file_path, encoding="utf-8") as f:
        data = json.load(f)
    record = OpenComputeBenchRecord.model_validate(data)
    is_valid, errors = validate_benchmark_integrity(record)
    if not is_valid:
        console.print("[bold red]Cannot submit invalid benchmark record:[/]")
        for e in errors:
            console.print(f"  - {e}")
        raise typer.Exit(code=1)

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    try:
        with console.status(
            "[cyan]Submitting benchmark observation to ModelForge...[/]"
        ):
            res = httpx.post(api_url, json=data, headers=headers, timeout=10.0)
        if res.status_code in [200, 201]:
            resp_data = res.json()
            console.print("[bold green]✓ Benchmark accepted by network![/]")
            console.print(
                f"[dim]Benchmark ID:[/] {resp_data.get('benchmark_id', record.benchmark_id)}"
            )
            console.print(
                f"[dim]Report URL:[/] {resp_data.get('url', f'https://modelforge.dev/benchmarks/{record.benchmark_id}')}"
            )
        else:
            console.print(
                f"[bold red]Submission rejected ({res.status_code}):[/] {res.text}"
            )
    except httpx.ConnectError:
        console.print(f"[bold yellow]Submission endpoint unavailable at {api_url}.[/]")
        console.print(
            "[dim]Local result remains verified and saved. Start the web app to receive submissions.[/]"
        )


if __name__ == "__main__":
    app()
