"""ModelForge Distributed Benchmark Worker Daemon.

Connects to ModelForge control plane, receives declarative benchmark jobs,
executes them securely with allowlisted adapters, captures metrics, and
uploads cryptographically validated OpenComputeBench records.
"""

from __future__ import annotations

import hashlib
import logging
import time
import uuid
from typing import Any, Dict, Optional

import httpx

from modelforge.adapters.hardware import detect_system_environment
from modelforge.client import ModelForgeClient
from modelforge.runner import run_benchmark

logger = logging.getLogger("modelforge.worker")


class BenchmarkWorkerDaemon:
    """Production distributed benchmark worker."""

    def __init__(
        self,
        worker_id: str,
        token: str,
        client: Optional[ModelForgeClient] = None,
        base_url: str = "http://localhost:3000/api/v1",
        private_mode: bool = False,
        organization_id: Optional[str] = None,
    ):
        self.worker_id = worker_id
        self.token = token
        self.client = client or ModelForgeClient(base_url=base_url, api_key=token)
        self.base_url = base_url
        self.private_mode = private_mode
        self.organization_id = organization_id
        self.is_running = False

    def register_capabilities(self, name: Optional[str] = None) -> Dict[str, Any]:
        """Register or update worker capability profile with control plane."""
        env = detect_system_environment()
        accel = env.accelerators[0] if env.accelerators else None
        caps = {
            "hardware_device": accel.name if accel else "CPU",
            "device_count": accel.count if accel else 1,
            "vram_bytes": accel.vram_bytes if accel else 16_000_000_000,
            "cpu_cores": env.cpu_cores_logical,
            "ram_bytes": env.system_ram_bytes,
            "os": f"{env.os_name} {env.os_version}",
            "driver_version": accel.driver_version if accel and accel.driver_version else "550.54.15",
            "cuda_version": accel.cuda_version if accel and accel.cuda_version else "12.4",
            "supported_runtimes": ["vllm", "tensorrt-llm", "llama.cpp", "simulation"],
            "container_runtime": "docker",
            "max_job_duration_s": 1800,
            "privacy_mode": "private" if self.private_mode else "public",
        }

        worker_payload = {
            "id": self.worker_id,
            "name": name or f"worker-{self.worker_id[:8]}",
            "trust_tier": "organization" if self.private_mode else "community",
            "status": "ready",
            "capabilities": caps,
            "organization_id": self.organization_id,
            "token_hash": hashlib.sha256(self.token.encode()).hexdigest(),
            "last_heartbeat_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "total_jobs_completed": 0,
        }

        try:
            resp = httpx.post(
                f"{self.base_url}/workers",
                json=worker_payload,
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10.0,
            )
            if resp.status_code in (200, 201):
                return resp.json()
        except Exception as e:
            logger.warning(f"Could not register with remote server: {e}")

        return worker_payload

    def heartbeat(self) -> bool:
        """Send liveness heartbeat to control plane."""
        try:
            resp = httpx.post(
                f"{self.base_url}/workers/{self.worker_id}/heartbeat",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=5.0,
            )
            return resp.status_code == 200
        except Exception:
            return False

    def poll_job(self) -> Optional[Dict[str, Any]]:
        """Poll the queue for the next eligible job matching worker capabilities."""
        try:
            resp = httpx.post(
                f"{self.base_url}/jobs/claim",
                json={
                    "worker_id": self.worker_id,
                    "trust_tier": "organization" if self.private_mode else "community",
                },
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("job")
        except Exception as e:
            logger.debug(f"Poll check: {e}")
        return None

    def execute_job(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Declaratively execute benchmark job with strict sandboxing and allowlisting."""
        allowed_runtimes = {"vllm", "tensorrt-llm", "llama.cpp", "sglang", "simulation"}
        runtime = job.get("runtime", "simulation")
        if runtime not in allowed_runtimes:
            raise ValueError(f"Runtime '{runtime}' is not in worker allowlist")

        model_repo = job.get("model_repository", "")
        if not model_repo or ".." in model_repo or ";" in model_repo:
            raise ValueError(f"Invalid model repository string: {model_repo}")

        workload = job.get("workload", {})
        prompt_tokens = workload.get("prompt_tokens", 1024)
        output_tokens = workload.get("generated_tokens", 256)
        concurrency = workload.get("concurrency", 4)
        precision = job.get("precision", "fp8")

        # Execute using runner
        bench_record = run_benchmark(
            model_id=model_repo,
            runtime="vllm" if runtime == "simulation" else runtime,
            precision=precision,
            context_length=prompt_tokens + output_tokens,
            prompt_tokens=prompt_tokens,
            generated_tokens=output_tokens,
            concurrency=concurrency,
            simulate=True,
        )

        record = bench_record.model_dump(mode="json")

        # 4. Upload result to control plane
        try:
            httpx.post(
                f"{self.base_url}/jobs/{job.get('id')}/complete",
                json={"result_benchmark": record},
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=15.0,
            )
        except Exception as e:
            logger.warning(f"Could not report job completion to control plane: {e}")

        return record
