"""Hardware detection adapters for NVIDIA, AMD, Apple Silicon, and CPU architectures."""

import os
import platform
import shutil
import subprocess
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel
import psutil


class DetectedAccelerator(BaseModel):
    vendor: Literal["nvidia", "amd", "apple", "intel", "cpu", "other"]
    name: str
    count: int = 1
    vram_bytes: int
    driver_version: Optional[str] = None
    cuda_version: Optional[str] = None
    rocm_version: Optional[str] = None
    interconnect: str = "pcie"


class SystemEnvironment(BaseModel):
    os_name: str
    os_version: str
    cpu_architecture: str
    cpu_cores_physical: int
    cpu_cores_logical: int
    system_ram_bytes: int
    available_ram_bytes: int
    disk_free_gb: float
    python_version: str
    accelerators: List[DetectedAccelerator]


def detect_system_environment() -> SystemEnvironment:
    """Gathers complete host system metrics and accelerator inventory."""
    os_name = platform.system()
    os_version = platform.version()
    cpu_arch = platform.machine()
    cores_phys = psutil.cpu_count(logical=False) or 1
    cores_log = psutil.cpu_count(logical=True) or 1
    vm = psutil.virtual_memory()
    disk = shutil.disk_usage(os.getcwd())

    accelerators = detect_accelerators()

    return SystemEnvironment(
        os_name=os_name,
        os_version=os_version,
        cpu_architecture=cpu_arch,
        cpu_cores_physical=cores_phys,
        cpu_cores_logical=cores_log,
        system_ram_bytes=vm.total,
        available_ram_bytes=vm.available,
        disk_free_gb=round(disk.free / (1024**3), 2),
        python_version=platform.python_version(),
        accelerators=accelerators,
    )


def detect_accelerators() -> List[DetectedAccelerator]:
    """Detects available accelerators with vendor fallback chain: NVIDIA -> AMD -> Apple -> CPU."""
    detected: List[DetectedAccelerator] = []

    # 1. Check NVIDIA via nvidia-smi
    if shutil.which("nvidia-smi"):
        try:
            output = subprocess.check_output(
                ["nvidia-smi", "--query-gpu=gpu_name,memory.total,driver_version", "--format=csv,noheader,nounits"],
                text=True,
                stderr=subprocess.DEVNULL,
                timeout=5,
            ).strip()
            if output:
                for line in output.splitlines():
                    parts = [p.strip() for p in line.split(",")]
                    if len(parts) >= 3:
                        name, mem_mb, driver = parts[0], parts[1], parts[2]
                        detected.append(
                            DetectedAccelerator(
                                vendor="nvidia",
                                name=name,
                                count=1,
                                vram_bytes=int(float(mem_mb) * 1024 * 1024),
                                driver_version=driver,
                                cuda_version=detect_cuda_version(),
                                interconnect="pcie",
                            )
                        )
                if detected:
                    return detected
        except Exception:
            pass

    # 2. Check Windows WMI video controller for AMD or other GPUs
    if platform.system() == "Windows":
        try:
            cmd = "powershell -NoProfile -Command \"Get-CimInstance Win32_VideoController | Select-Object -Property Name, AdapterRAM, DriverVersion | ConvertTo-Json -Compress\""
            res = subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.DEVNULL, timeout=6).strip()
            if res:
                import json
                data = json.loads(res)
                controllers = data if isinstance(data, list) else [data]
                for c in controllers:
                    gpu_name = c.get("Name", "")
                    adapter_ram = c.get("AdapterRAM", 0) or 0
                    driver_ver = c.get("DriverVersion", "")
                    if "amd" in gpu_name.lower() or "radeon" in gpu_name.lower():
                        detected.append(
                            DetectedAccelerator(
                                vendor="amd",
                                name=gpu_name,
                                count=1,
                                vram_bytes=int(adapter_ram) if adapter_ram > 0 else 8 * 1024**3,
                                driver_version=str(driver_ver),
                                interconnect="system_bus",
                            )
                        )
                        break
        except Exception:
            pass

    # 3. Check Apple Silicon
    if platform.system() == "Darwin" and platform.machine() == "arm64":
        vm = psutil.virtual_memory()
        detected.append(
            DetectedAccelerator(
                vendor="apple",
                name="Apple Silicon Neural Engine / GPU",
                count=1,
                vram_bytes=vm.total,
                interconnect="unified_memory",
            )
        )
        return detected

    # 4. Fallback to Host CPU
    if not detected:
        vm = psutil.virtual_memory()
        detected.append(
            DetectedAccelerator(
                vendor="cpu",
                name=f"Host CPU ({platform.processor() or platform.machine()})",
                count=1,
                vram_bytes=vm.total,
                interconnect="system_bus",
            )
        )

    return detected


def detect_cuda_version() -> Optional[str]:
    """Inspects nvcc or environment for CUDA version."""
    if shutil.which("nvcc"):
        try:
            out = subprocess.check_output(["nvcc", "--version"], text=True, timeout=5)
            for line in out.splitlines():
                if "release" in line:
                    parts = line.split("release")
                    if len(parts) > 1:
                        return parts[1].split(",")[0].strip()
        except Exception:
            pass
    return None
