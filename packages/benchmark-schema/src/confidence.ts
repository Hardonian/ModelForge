/**
 * ModelForge Evidence Confidence Engine
 * Version: 1.0.0
 *
 * Formalized, deterministic calculation of deployment intelligence confidence.
 * Never uses heuristic vanity numbers or ungrounded LLM guesses.
 */

export const CONFIDENCE_ALGORITHM_VERSION = "1.0.0";

export interface ConfidenceFactors {
  /** True if benchmark was run on exact Git commit revision, false if fallback/branch HEAD */
  exactRevisionMatch: boolean;
  /** Runtime engine match fidelity */
  runtimeMatch: "EXACT" | "COMPATIBLE" | "ESTIMATED";
  /** Accelerator device match */
  hardwareMatch: "EXACT" | "SAME_ARCH" | "DIFFERENT_ARCH";
  /** Total number of independent benchmark runs observed */
  benchmarkRunCount: number;
  /** Number of independent cross-contributor reproductions */
  reproductionCount: number;
  /** Age of most recent measurement in days */
  ageDays: number;
  /** Measured coefficient of variation across runs (%) */
  measurementVariancePercent?: number;
}

export interface ConfidenceBreakdown {
  revision_score: number; // max 25
  runtime_score: number; // max 20
  hardware_score: number; // max 20
  sample_volume_score: number; // max 10
  reproduction_score: number; // max 15
  freshness_score: number; // max 5
  variance_score: number; // max 5
}

export interface ConfidenceEvaluation {
  score: number;
  algorithm_version: typeof CONFIDENCE_ALGORITHM_VERSION;
  grade: "A+" | "A" | "B" | "C" | "D";
  breakdown: ConfidenceBreakdown;
  explanation: string;
}

/**
 * Computes deterministic evidence confidence score (0-100)
 */
export function calculateEvidenceConfidence(
  factors: ConfidenceFactors,
): ConfidenceEvaluation {
  // 1. Revision Match (Max 25 pts)
  const revisionScore = factors.exactRevisionMatch ? 25 : 10;

  // 2. Runtime Fidelity (Max 20 pts)
  let runtimeScore = 4;
  if (factors.runtimeMatch === "EXACT") runtimeScore = 20;
  else if (factors.runtimeMatch === "COMPATIBLE") runtimeScore = 12;

  // 3. Hardware Fidelity (Max 20 pts)
  let hardwareScore = 4;
  if (factors.hardwareMatch === "EXACT") hardwareScore = 20;
  else if (factors.hardwareMatch === "SAME_ARCH") hardwareScore = 12;

  // 4. Sample Volume (Max 10 pts, 2 pts per run up to 5 runs)
  const sampleVolumeScore = Math.min(
    10,
    Math.max(0, factors.benchmarkRunCount * 2),
  );

  // 5. Reproductions (Max 15 pts, 5 pts per reproduction up to 3)
  const reproductionScore = Math.min(
    15,
    Math.max(0, factors.reproductionCount * 5),
  );

  // 6. Freshness (Max 5 pts)
  let freshnessScore = 0;
  if (factors.ageDays <= 30) freshnessScore = 5;
  else if (factors.ageDays <= 90) freshnessScore = 3;
  else if (factors.ageDays <= 180) freshnessScore = 1;

  // 7. Variance Consistency (Max 5 pts)
  let varianceScore = 3; // default if not provided
  if (factors.measurementVariancePercent !== undefined) {
    if (factors.measurementVariancePercent <= 3.0) varianceScore = 5;
    else if (factors.measurementVariancePercent <= 8.0) varianceScore = 4;
    else if (factors.measurementVariancePercent <= 15.0) varianceScore = 2;
    else varianceScore = 0;
  }

  const totalScore = Math.min(
    100,
    Math.max(
      0,
      revisionScore +
        runtimeScore +
        hardwareScore +
        sampleVolumeScore +
        reproductionScore +
        freshnessScore +
        varianceScore,
    ),
  );

  let grade: "A+" | "A" | "B" | "C" | "D" = "D";
  if (totalScore >= 95) grade = "A+";
  else if (totalScore >= 85) grade = "A";
  else if (totalScore >= 70) grade = "B";
  else if (totalScore >= 50) grade = "C";

  const explanation =
    `Score ${totalScore}/100 (${grade}) under algorithm v${CONFIDENCE_ALGORITHM_VERSION}: ` +
    `${factors.exactRevisionMatch ? "Exact revision" : "Fallback branch"}, ` +
    `${factors.runtimeMatch.toLowerCase()} runtime match, ` +
    `${factors.hardwareMatch.toLowerCase()} accelerator, ` +
    `${factors.benchmarkRunCount} run(s), ${factors.reproductionCount} reproduction(s), ` +
    `${factors.ageDays}d freshness.`;

  return {
    score: totalScore,
    algorithm_version: CONFIDENCE_ALGORITHM_VERSION,
    grade,
    breakdown: {
      revision_score: revisionScore,
      runtime_score: runtimeScore,
      hardware_score: hardwareScore,
      sample_volume_score: sampleVolumeScore,
      reproduction_score: reproductionScore,
      freshness_score: freshnessScore,
      variance_score: varianceScore,
    },
    explanation,
  };
}
