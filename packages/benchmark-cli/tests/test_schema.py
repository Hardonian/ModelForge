"""Unit tests for Python OpenComputeBench schema and deterministic hashing."""

from modelforge.schema import (
    HardwareSpec,
    LatencyPercentiles,
    MetricsSpec,
    ModelSpec,
    OpenComputeBenchRecord,
    PrecisionSpec,
    ProvenanceSpec,
    RuntimeSpec,
    SoftwareSpec,
    VerificationSpec,
    WorkloadSpec,
    compute_environment_hash,
    compute_result_hash,
    validate_benchmark_integrity,
)


def create_sample_record():
    m = ModelSpec(
        provider="Qwen",
        repository="Qwen/Qwen2.5-32B-Instruct",
        revision="main",
        architecture="Qwen2ForCausalLM",
        parameters_billions=32.5,
    )
    r = RuntimeSpec(name="vllm", version="0.6.4", engine_args={})
    p = PrecisionSpec(type="fp8", quantization_method="fp8_e4m3")
    h = HardwareSpec(
        vendor="nvidia",
        device="NVIDIA L40S",
        count=1,
        vram_bytes_per_device=51539607552,
        total_vram_bytes=51539607552,
        interconnect="pcie",
    )
    s = SoftwareSpec(
        os="Ubuntu 22.04 LTS",
        driver_version="550.54.15",
        cuda_version="12.4",
        python_version="3.12.2",
    )
    w = WorkloadSpec(prompt_tokens=1024, generated_tokens=256, context_length=1280)
    metrics = MetricsSpec(
        ttft_ms=LatencyPercentiles(p50_ms=280.0, p90_ms=310.0, p95_ms=330.0, p99_ms=360.0, mean_ms=285.0),
        tpot_ms=LatencyPercentiles(p50_ms=13.8, p90_ms=14.5, p95_ms=15.1, p99_ms=16.0, mean_ms=14.0),
        tokens_per_second=72.4,
        requests_per_second=0.28,
        peak_vram_bytes=38654705664,
        sample_count=20,
    )

    env_hash = compute_environment_hash(h, s, r)
    res_hash = compute_result_hash(m, p, w, metrics)

    prov = ProvenanceSpec(
        submitted_by="test-runner",
        runner_version="0.1.0",
        started_at="2025-01-15T12:00:00Z",
        completed_at="2025-01-15T12:05:00Z",
        environment_hash=env_hash,
        result_hash=res_hash,
    )

    return OpenComputeBenchRecord(
        benchmark_id="11111111-2222-3333-4444-555555555555",
        model=m,
        runtime=r,
        precision=p,
        hardware=h,
        software=s,
        workload=w,
        metrics=metrics,
        provenance=prov,
        verification=VerificationSpec(status="verified"),
    )


def test_valid_benchmark_integrity():
    rec = create_sample_record()
    is_valid, errors = validate_benchmark_integrity(rec)
    assert is_valid is True
    assert len(errors) == 0


def test_tampered_result_hash_detected():
    rec = create_sample_record()
    rec.metrics.tokens_per_second = 999.9  # Tampered
    is_valid, errors = validate_benchmark_integrity(rec)
    assert is_valid is False
    assert any("Result hash mismatch" in e for e in errors)


def test_synthetic_fixture_cannot_be_verified():
    rec = create_sample_record()
    rec.synthetic_fixture = True
    rec.verification.status = "verified"
    is_valid, errors = validate_benchmark_integrity(rec)
    assert is_valid is False
    assert any("Synthetic fixtures cannot be marked as verified" in e for e in errors)
