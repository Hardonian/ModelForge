"""Official ModelForge Python Client SDK.

Provides typed programmatic access to ModelForge Compute Passports,
Inference SLO Compiler, Benchmark observations, and Support Matrix.
"""

from typing import Any

import httpx

DEFAULT_BASE_URL = "http://localhost:3000/api/v1"


class ModelForgeAPIError(Exception):
    """Raised when the ModelForge API returns an error response."""

    def __init__(self, message: str, status_code: int | None = None, details: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details


class ModelForgeClient:
    """Official Python SDK client for ModelForge."""

    def __init__(
        self,
        base_url: str = DEFAULT_BASE_URL,
        api_key: str | None = None,
        timeout: float = 15.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

    def _headers(self) -> dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "ModelForge-Python-SDK/1.0.0",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _request(self, method: str, path: str, **kwargs) -> Any:
        url = f"{self.base_url}{path}"
        headers = {**self._headers(), **kwargs.pop("headers", {})}
        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.request(method, url, headers=headers, **kwargs)
                if not res.is_success:
                    try:
                        err_json = res.json()
                        msg = err_json.get("error") or err_json.get("message") or res.text
                    except Exception:
                        msg = res.text
                    raise ModelForgeAPIError(f"API Error ({res.status_code}): {msg}", status_code=res.status_code)
                return res.json()
        except httpx.RequestError as exc:
            raise ModelForgeAPIError(f"Network error contacting {url}: {exc}") from exc

    def get_health(self) -> dict[str, Any]:
        """Check system health status (liveness and readiness)."""
        return self._request("GET", "/health" if "/api" in self.base_url else "/api/health")

    def get_support_matrix(self) -> dict[str, Any]:
        """Retrieve verified v1 support matrix across models, runtimes, accelerators, and backends."""
        return self._request("GET", "/support-matrix")

    def get_models(self, family: str | None = None) -> list[dict[str, Any]]:
        """List registered models, optionally filtered by family."""
        params = {"family": family} if family else None
        return self._request("GET", "/models", params=params)

    def get_model(self, model_id: str) -> dict[str, Any]:
        """Fetch model architecture metadata."""
        return self._request("GET", f"/models/{model_id}")

    def get_compute_passport(self, model_id: str, revision: str = "main") -> dict[str, Any]:
        """Fetch revision-specific Compute Passport."""
        return self._request("GET", f"/models/{model_id}/passport", params={"rev": revision})

    def list_benchmarks(
        self,
        model: str | None = None,
        hardware: str | None = None,
        runtime: str | None = None,
        precision: str | None = None,
        golden_only: bool = False,
    ) -> list[dict[str, Any]]:
        """Query benchmark records matching constraints."""
        params = {}
        if model:
            params["model"] = model
        if hardware:
            params["hardware"] = hardware
        if runtime:
            params["runtime"] = runtime
        if precision:
            params["precision"] = precision
        if golden_only:
            params["golden"] = "true"
        return self._request("GET", "/benchmarks", params=params)

    def get_benchmark(self, benchmark_id: str) -> dict[str, Any]:
        """Retrieve specific benchmark observation by UUID."""
        return self._request("GET", f"/benchmarks/{benchmark_id}")

    def compile_slo(
        self,
        model_id: str,
        workload: dict[str, Any],
        slo: dict[str, Any] | None = None,
        revision: str = "main",
    ) -> dict[str, Any]:
        """Compile an inference workload and latency target into ranked serving topologies."""
        payload = {
            "model_id": model_id,
            "revision": revision,
            "workload": workload,
            "slo": slo or {},
        }
        return self._request("POST", "/plans", json=payload)

    def generate_plan(
        self,
        model_id: str,
        workload: dict[str, Any],
        target: str = "vllm",
        slo: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Synthesize a complete deployment plan with deployment manifests."""
        plan = self.compile_slo(model_id=model_id, workload=workload, slo=slo)
        return plan

    def get_software_lift(self, model_id: str | None = None, accelerator: str | None = None) -> list[dict[str, Any]]:
        """Query empirical software lift metrics across runtimes."""
        params = {}
        if model_id:
            params["model"] = model_id
        if accelerator:
            params["accelerator"] = accelerator
        return self._request("GET", "/software-lift", params=params)

    def get_failures(self, model_id: str | None = None, runtime: str | None = None) -> list[dict[str, Any]]:
        """Retrieve normalized failure records and incompatibility intelligence."""
        params = {}
        if model_id:
            params["model"] = model_id
        if runtime:
            params["runtime"] = runtime
        return self._request("GET", "/failures", params=params)
