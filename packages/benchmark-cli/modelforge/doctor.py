"""System diagnostics and incompatibility inspection for modelforge doctor."""

import shutil
import sys
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from modelforge.adapters.hardware import detect_system_environment


def run_doctor(console: Console) -> bool:
    """Performs deep health and compatibility diagnostics on the local environment."""
    env = detect_system_environment()
    table = Table(title="ModelForge System Health & Hardware Diagnostics", show_lines=True)
    table.add_column("Category", style="cyan", width=16)
    table.add_column("Component", style="bold white", width=22)
    table.add_column("Detected Value", style="white", width=36)
    table.add_column("Status", width=12)

    has_warnings = False
    has_critical = False

    # 1. Operating System
    table.add_row("Environment", "Operating System", f"{env.os_name} ({env.os_version[:25]})", "[bold green]PASS[/]")
    table.add_row("Environment", "CPU Architecture", f"{env.cpu_architecture} ({env.cpu_cores_logical} vCPUs)", "[bold green]PASS[/]")

    # 2. Python Version
    py_status = "[bold green]PASS[/]" if sys.version_info >= (3, 12) else "[bold red]FAIL (Need 3.12+)[/]"
    table.add_row("Runtime", "Python Interpreter", f"{env.python_version} ({sys.executable[:30]}...)", py_status)
    if sys.version_info < (3, 12):
        has_critical = True

    # 3. System RAM & Disk
    ram_gb = round(env.system_ram_bytes / (1024**3), 1)
    avail_ram_gb = round(env.available_ram_bytes / (1024**3), 1)
    ram_status = "[bold green]PASS[/]" if ram_gb >= 16 else "[bold yellow]WARN (<16GB)[/]"
    table.add_row("Memory", "System RAM", f"{ram_gb} GB total ({avail_ram_gb} GB free)", ram_status)

    disk_status = "[bold green]PASS[/]" if env.disk_free_gb >= 20 else "[bold yellow]WARN (<20GB)[/]"
    table.add_row("Storage", "Working Disk Space", f"{env.disk_free_gb} GB available", disk_status)

    # 4. Accelerators
    for acc in env.accelerators:
        acc_vram_gb = round(acc.vram_bytes / (1024**3), 1)
        if acc.vendor == "nvidia":
            status = "[bold green]OPTIMAL (NVIDIA)[/]"
        elif acc.vendor == "amd":
            status = "[bold green]SUPPORTED (AMD)[/]"
        elif acc.vendor == "apple":
            status = "[bold green]SUPPORTED (Apple)[/]"
        else:
            status = "[bold yellow]FALLBACK (CPU)[/]"
            has_warnings = True

        val = f"{acc.name} [{acc_vram_gb} GB]"
        if acc.driver_version:
            val += f" (Driver: {acc.driver_version})"
        table.add_row("Hardware", f"GPU / Accelerator", val, status)

    # 5. Serving Runtime Dependencies
    vllm_installed = shutil.which("vllm") is not None
    table.add_row(
        "Runtimes",
        "vLLM Engine",
        "Installed in PATH" if vllm_installed else "Not detected (Simulated / CPU fallback available)",
        "[bold green]READY[/]" if vllm_installed else "[bold yellow]OPTIONAL[/]",
    )

    console.print(table)

    if has_critical:
        console.print(Panel("[bold red]Critical system requirements missing.[/] Upgrade Python to 3.12+ before continuing.", title="Diagnosis"))
        return False
    elif has_warnings:
        console.print(Panel("[bold yellow]Environment is ready for development, CPU benchmarks, and simulation mode.[/]\nLive production GPU benchmarks require NVIDIA CUDA or AMD ROCm drivers.", title="Diagnosis"))
        return True
    else:
        console.print(Panel("[bold green]System is 100% compliant with ModelForge OpenComputeBench requirements.[/]", title="Diagnosis"))
        return True
