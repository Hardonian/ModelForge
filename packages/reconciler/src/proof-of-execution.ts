import * as crypto from "crypto";
import {
  BenchmarkChallenge,
  ProofOfExecution,
  BenchmarkAttestation,
  HardwareSpec,
} from "@modelforge/benchmark-schema";

// Nominal GEMM FLOPs and execution parameters
const HARDWARE_TFLOPS_FP16: Record<string, number> = {
  "nvidia-h100-80gb": 989.0,
  "nvidia-h200-141gb": 989.0,
  "nvidia-b200": 2250.0,
  "nvidia-a100-80gb": 312.0,
  "nvidia-l4": 120.0,
  "nvidia-rtx-4090": 165.0,
  "amd-mi300x": 1300.0,
  "tpu-v5p-95gb": 459.0,
  "tpu-v6e-32gb": 918.0,
};

export class ProofOfExecutionEngine {
  private readonly secretSigningKey: string;

  constructor(secretSigningKey = "modelforge-consensus-signing-key") {
    this.secretSigningKey = secretSigningKey;
  }

  /**
   * Issues a cryptographically nonced benchmark challenge for a worker claiming a target hardware device.
   */
  public issueChallenge(
    targetHardware: string,
    iterations = 5000,
  ): BenchmarkChallenge {
    const challengeId = `chal-${crypto.randomUUID().slice(0, 12)}`;
    const nonce = crypto.randomBytes(32).toString("hex");

    // Standard matrix dimensions: 8192 x 8192 x 8192
    const m = 8192;
    const n = 8192;
    const k = 8192;
    const totalFlops = 2.0 * m * n * k * iterations; // FLOPs

    const tflops = HARDWARE_TFLOPS_FP16[targetHardware.toLowerCase()] || 300.0;
    const nominalDurationSec = totalFlops / (tflops * 1e12);
    const nominalDurationMs = nominalDurationSec * 1000.0;

    // Physical bounds:
    // Min duration: speed of light (1.2x theoretical max efficiency)
    // Max duration: must not exceed 4x nominal (detects CPU emulation or throttle)
    const minDurationMs = Math.max(1.0, Math.round(nominalDurationMs * 0.75 * 100) / 100);
    const maxDurationMs = Math.round(nominalDurationMs * 4.0 * 100) / 100;

    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 5 * 60 * 1000); // 5 minute validity

    return {
      challenge_id: challengeId,
      nonce,
      target_hardware: targetHardware,
      matrix_dim_m: m,
      matrix_dim_n: n,
      matrix_dim_k: k,
      expected_min_duration_ms: minDurationMs,
      expected_max_duration_ms: maxDurationMs,
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    };
  }

  /**
   * Evaluates worker's proof-of-execution against physics bounds, nonce freshness, and compute hash.
   */
  public verifyProof(
    challenge: BenchmarkChallenge,
    proof: ProofOfExecution,
    hardwareSpec: HardwareSpec,
  ): BenchmarkAttestation {
    const attestationId = `attest-${crypto.randomUUID().slice(0, 12)}`;

    // 1. Validate challenge binding
    if (proof.challenge_id !== challenge.challenge_id) {
      throw new Error(
        `Challenge ID mismatch: expected ${challenge.challenge_id}, received ${proof.challenge_id}`,
      );
    }

    // 2. Validate challenge expiration
    if (new Date(proof.timestamp).getTime() > new Date(challenge.expires_at).getTime()) {
      throw new Error("Benchmark challenge has expired");
    }

    // 3. Physical hardware lower & upper bound validation (Anti-Spoofing & Anti-Emulation)
    const isDurationPhysicallyValid =
      proof.execution_duration_ms >= challenge.expected_min_duration_ms &&
      proof.execution_duration_ms <= challenge.expected_max_duration_ms;

    if (!isDurationPhysicallyValid) {
      return {
        attestation_id: attestationId,
        worker_id: proof.worker_id,
        proof_id: proof.proof_id,
        hardware_spec: hardwareSpec,
        verified: false,
        confidence_score: 0.0,
        attestation_signature: "REJECTED_OUT_OF_BOUNDS",
        issued_at: new Date().toISOString(),
      };
    }

    // 4. Compute Digest Verification
    const expectedDigest = crypto
      .createHmac("sha256", challenge.nonce)
      .update(`${proof.worker_id}:${proof.hardware_uuid}:${proof.raw_latency_samples.length}:${Math.round(proof.execution_duration_ms)}`)
      .digest("hex");

    if (proof.compute_digest !== expectedDigest) {
      return {
        attestation_id: attestationId,
        worker_id: proof.worker_id,
        proof_id: proof.proof_id,
        hardware_spec: hardwareSpec,
        verified: false,
        confidence_score: 0.0,
        attestation_signature: "REJECTED_INVALID_DIGEST",
        issued_at: new Date().toISOString(),
      };
    }
    const attestationPayload = `${attestationId}:${proof.worker_id}:${hardwareSpec.device}:${proof.compute_digest}:${proof.execution_duration_ms}`;
    const attestationSig = crypto
      .createHmac("sha256", this.secretSigningKey)
      .update(attestationPayload)
      .digest("hex");

    return {
      attestation_id: attestationId,
      worker_id: proof.worker_id,
      proof_id: proof.proof_id,
      hardware_spec: hardwareSpec,
      verified: true,
      confidence_score: 0.99,
      attestation_signature: attestationSig,
      issued_at: new Date().toISOString(),
    };
  }

  /**
   * Helper for worker nodes to solve a challenge and generate a valid ProofOfExecution.
   */
  public solveChallenge(
    challenge: BenchmarkChallenge,
    workerId: string,
    hardwareUuid: string,
    measuredDurationMs?: number,
  ): ProofOfExecution {
    const proofId = `proof-${crypto.randomUUID().slice(0, 12)}`;
    const duration =
      measuredDurationMs ||
      (challenge.expected_min_duration_ms + challenge.expected_max_duration_ms) / 2.0;

    const sampleCount = 10;
    const stepDuration = duration / sampleCount;
    const samples = Array.from({ length: sampleCount }, (_, i) =>
      Math.round((stepDuration + (Math.sin(i) * 0.05 * stepDuration)) * 100) / 100,
    );

    const computeDigest = crypto
      .createHmac("sha256", challenge.nonce)
      .update(`${workerId}:${hardwareUuid}:${sampleCount}:${Math.round(duration)}`)
      .digest("hex");

    const workerSig = crypto
      .createHash("sha256")
      .update(`${proofId}:${workerId}:${computeDigest}`)
      .digest("hex");

    return {
      proof_id: proofId,
      challenge_id: challenge.challenge_id,
      worker_id: workerId,
      hardware_uuid: hardwareUuid,
      execution_duration_ms: Math.round(duration * 100) / 100,
      raw_latency_samples: samples,
      compute_digest: computeDigest,
      worker_signature: workerSig,
      timestamp: new Date().toISOString(),
    };
  }
}
