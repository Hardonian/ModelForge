import test from "node:test";
import assert from "node:assert/strict";
import { ProofOfExecutionEngine } from "../proof-of-execution";
import { HardwareSpec } from "@modelforge/benchmark-schema";

const mockHardware: HardwareSpec = {
  vendor: "nvidia",
  device: "nvidia-h100-80gb",
  count: 1,
  vram_bytes_per_device: 80 * 1024 * 1024 * 1024,
  total_vram_bytes: 80 * 1024 * 1024 * 1024,
  interconnect: "sxm5",
};

test("ProofOfExecutionEngine - Issues valid cryptographic challenge", () => {
  const engine = new ProofOfExecutionEngine();
  const challenge = engine.issueChallenge("nvidia-h100-80gb");

  assert.ok(challenge.challenge_id.startsWith("chal-"));
  assert.equal(challenge.nonce.length, 64);
  assert.equal(challenge.matrix_dim_m, 8192);
  assert.ok(challenge.expected_min_duration_ms > 0);
  assert.ok(challenge.expected_max_duration_ms > challenge.expected_min_duration_ms);
});

test("ProofOfExecutionEngine - Validates legitimate worker proof and issues signed attestation", () => {
  const engine = new ProofOfExecutionEngine();
  const challenge = engine.issueChallenge("nvidia-h100-80gb");
  const proof = engine.solveChallenge(challenge, "worker-node-42", "uuid-h100-sxm5-001");

  const attestation = engine.verifyProof(challenge, proof, mockHardware);

  assert.equal(attestation.verified, true);
  assert.equal(attestation.worker_id, "worker-node-42");
  assert.equal(attestation.confidence_score, 0.99);
  assert.ok(attestation.attestation_signature.length > 32);
});

test("ProofOfExecutionEngine - Anti-Spoofing: Rejects physically impossible execution time", () => {
  const engine = new ProofOfExecutionEngine();
  const challenge = engine.issueChallenge("nvidia-h100-80gb");
  // Worker claims to have executed GEMM in 0.001 ms (exceeding speed of light)
  const spoofedProof = engine.solveChallenge(
    challenge,
    "cheating-worker",
    "uuid-spoofed-001",
    0.001,
  );

  const attestation = engine.verifyProof(challenge, spoofedProof, mockHardware);

  assert.equal(attestation.verified, false);
  assert.equal(attestation.confidence_score, 0.0);
  assert.equal(attestation.attestation_signature, "REJECTED_OUT_OF_BOUNDS");
});
