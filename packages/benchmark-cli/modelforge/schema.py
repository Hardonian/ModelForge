"""OpenComputeBench Pydantic schema and deterministic hashing utilities."""

import hashlib
import json
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field


class ModelSpec(BaseModel):
    provider: str
    repository: str
    revision: str = "main"
    architecture: str
    parameters_billions: float
    context_window: int | None = None
    vocab_size: int | None = None


class RuntimeSpec(BaseModel):
    name: Literal[
        "vllm",
        "tensorrt-llm",
        "llama.cpp",
        "sglang",
        "tgi",
        "transformers",
        "simulation",
    ]
    version: str
    engine_args: dict[str, Any] = Field(default_factory=dict)


class PrecisionSpec(BaseModel):
    type: Literal["fp32", "tf32", "fp16", "bf16", "fp8", "int8", "int4", "awq", "gptq"]
    quantization_method: str | None = None


class HardwareSpec(BaseModel):
    vendor: Literal["nvidia", "amd", "apple", "intel", "cpu", "other"]
    device: str
    count: int = 1
    vram_bytes_per_device: int
    total_vram_bytes: int
    interconnect: str = "pcie"


class SoftwareSpec(BaseModel):
    os: str
    driver_version: str | None = None
    cuda_version: str | None = None
    rocm_version: str | None = None
    python_version: str


class WorkloadSpec(BaseModel):
    prompt_tokens: int
    generated_tokens: int
    context_length: int
    batch_size: int = 1
    concurrency: int = 1


class LatencyPercentiles(BaseModel):
    p50_ms: float
    p90_ms: float
    p95_ms: float
    p99_ms: float
    mean_ms: float
    std_dev_ms: float | None = None


class MetricsSpec(BaseModel):
    ttft_ms: LatencyPercentiles
    tpot_ms: LatencyPercentiles
    tokens_per_second: float
    requests_per_second: float
    peak_vram_bytes: int
    peak_ram_bytes: int | None = None
    power_watts_avg: float | None = None
    sample_count: int = 1


class QualitySpec(BaseModel):
    benchmark: str | None = None
    score: float | None = None
    baseline_score: float | None = None
    retention: float | None = None


class ProvenanceSpec(BaseModel):
    submitted_by: str
    runner_version: str
    started_at: str
    completed_at: str
    environment_hash: str
    result_hash: str


class VerificationSpec(BaseModel):
    status: Literal["unverified", "community", "reproduced", "verified"] = "unverified"
    reproduction_count: int = 0
    verified_by: str | None = None
    notes: str | None = None


class OpenComputeBenchRecord(BaseModel):
    benchmark_id: str = Field(default_factory=lambda: str(uuid4()))
    schema_version: Literal["1.0.0"] = "1.0.0"
    synthetic_fixture: bool = False
    golden: bool = False
    model: ModelSpec
    runtime: RuntimeSpec
    precision: PrecisionSpec
    hardware: HardwareSpec
    software: SoftwareSpec
    workload: WorkloadSpec
    metrics: MetricsSpec
    quality: QualitySpec | None = None
    provenance: ProvenanceSpec
    verification: VerificationSpec = Field(default_factory=VerificationSpec)


def canonical_json_dumps(data: Any) -> str:
    """Deterministic JSON stringification with sorted keys and no unnecessary whitespace."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"))


def compute_sha256(data: Any) -> str:
    """Computes hex SHA-256 hash of canonical JSON representation."""
    canonical = canonical_json_dumps(data)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def compute_environment_hash(hardware: HardwareSpec, software: SoftwareSpec, runtime: RuntimeSpec) -> str:
    payload = {
        "hardware": {
            "vendor": hardware.vendor,
            "device": hardware.device,
            "count": hardware.count,
            "vram_bytes_per_device": hardware.vram_bytes_per_device,
            "interconnect": hardware.interconnect,
        },
        "software": {
            "os": software.os,
            "driver_version": software.driver_version,
            "cuda_version": software.cuda_version,
            "rocm_version": software.rocm_version,
            "python_version": software.python_version,
        },
        "runtime": {
            "name": runtime.name,
            "version": runtime.version,
        },
    }
    return compute_sha256(payload)


def compute_result_hash(
    model: ModelSpec,
    precision: PrecisionSpec,
    workload: WorkloadSpec,
    metrics: MetricsSpec,
) -> str:
    payload = {
        "model": {
            "provider": model.provider,
            "repository": model.repository,
            "revision": model.revision,
            "architecture": model.architecture,
        },
        "precision": {
            "type": precision.type,
            "quantization_method": precision.quantization_method,
        },
        "workload": {
            "prompt_tokens": workload.prompt_tokens,
            "generated_tokens": workload.generated_tokens,
            "context_length": workload.context_length,
            "batch_size": workload.batch_size,
            "concurrency": workload.concurrency,
        },
        "metrics": {
            "ttft_p50_ms": metrics.ttft_ms.p50_ms,
            "tpot_p50_ms": metrics.tpot_ms.p50_ms,
            "tokens_per_second": metrics.tokens_per_second,
            "peak_vram_bytes": metrics.peak_vram_bytes,
        },
    }
    return compute_sha256(payload)


def validate_benchmark_integrity(
    record: OpenComputeBenchRecord,
) -> tuple[bool, list[str]]:
    errors: list[str] = []
    expected_env = compute_environment_hash(record.hardware, record.software, record.runtime)
    if record.provenance.environment_hash != expected_env:
        errors.append(f"Environment hash mismatch: got {record.provenance.environment_hash}, expected {expected_env}")

    expected_result = compute_result_hash(record.model, record.precision, record.workload, record.metrics)
    if record.provenance.result_hash != expected_result:
        errors.append(f"Result hash mismatch: got {record.provenance.result_hash}, expected {expected_result}")

    if record.synthetic_fixture and record.verification.status == "verified":
        errors.append("CRITICAL INVARIANT VIOLATION: Synthetic fixtures cannot be marked as verified.")

    return len(errors) == 0, errors
