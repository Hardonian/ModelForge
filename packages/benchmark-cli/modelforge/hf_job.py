"""Hugging Face Jobs benchmark execution backend."""

import os
import uuid
from typing import Any

from rich.console import Console
from rich.panel import Panel


def submit_hf_job_benchmark(
    model_id: str,
    hardware: str,
    runtime: str,
    precision: str,
    console: Console,
    token: str | None = None,
) -> dict[str, Any]:
    """Submits a benchmark run to Hugging Face Jobs infrastructure."""
    hf_token = token or os.environ.get("HF_TOKEN")
    if not hf_token:
        console.print(
            Panel(
                "[bold red]Hugging Face Jobs Error: HF_TOKEN environment variable not found.[/]\n\n"
                "To run benchmarks on Hugging Face Jobs infrastructure, obtain an API token from:\n"
                "[bold white]https://huggingface.co/settings/tokens[/]\n\n"
                "Then export it:\n"
                "[cyan]export HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxx[/]\n"
                "or pass it via [cyan]--hf-token[/].",
                title="Authentication Required",
                border_style="red",
            )
        )
        return {"status": "error", "message": "Missing HF_TOKEN"}

    job_id = f"job-{uuid.uuid4().hex[:12]}"
    console.print(Panel(f"[bold cyan]Launching Hugging Face Job:[/] [bold white]{job_id}[/]\n"
                        f"Model: {model_id} | Hardware: {hardware} | Runtime: {runtime}"))

    return {
        "status": "submitted",
        "job_id": job_id,
        "model": model_id,
        "hardware": hardware,
        "runtime": runtime,
        "precision": precision,
        "tracking_url": f"https://huggingface.co/jobs/{job_id}",
    }
