import test from "node:test";
import assert from "node:assert/strict";
import { SpeculativeDecodingProfiler } from "../speculative";

test("Speculative Decoding Profiler - Llama 3 70B + 8B Evaluation", () => {
  const profile = SpeculativeDecodingProfiler.profilePair(
    "meta-llama/Llama-3-70B",
    "meta-llama/Llama-3-8B",
    { domain: "code", lookahead_gamma: 5 },
  );

  assert.equal(profile.target_model, "meta-llama/Llama-3-70B");
  assert.equal(profile.draft_model, "meta-llama/Llama-3-8B");
  assert.ok(profile.empirical_acceptance_rate > 0.7);
  assert.ok(profile.expected_accepted_tokens > 3.0);
  assert.ok(profile.empirical_speedup > 1.4);
  assert.ok(profile.draft_memory_overhead_mb > 0);
  assert.ok(profile.break_even_acceptance_rate < profile.empirical_acceptance_rate);
});

test("Speculative Decoding Profiler - Gamma Sweep", () => {
  const sweep = SpeculativeDecodingProfiler.sweepGamma("meta-llama/Llama-3-70B");
  assert.equal(sweep.length, 10);
  assert.equal(sweep[0]!.gamma, 1);
  assert.equal(sweep[9]!.gamma, 10);
  // Speedup should be peak around gamma 4-7
  const maxSpeedup = Math.max(...sweep.map((s) => s.speedup));
  assert.ok(maxSpeedup > 1.5);
});

test("Speculative Decoding Profiler - Domain Variations", () => {
  const codeProfile = SpeculativeDecodingProfiler.profilePair(
    "google/gemma-2-27b",
    undefined,
    { domain: "code" },
  );
  const reasoningProfile = SpeculativeDecodingProfiler.profilePair(
    "google/gemma-2-27b",
    undefined,
    { domain: "reasoning" },
  );

  assert.ok(
    codeProfile.empirical_acceptance_rate > reasoningProfile.empirical_acceptance_rate,
    "Code should have higher speculative acceptance rate than reasoning",
  );
});
