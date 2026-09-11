import { NextRequest, NextResponse } from "next/server";
import { ProofOfExecutionEngine } from "@modelforge/reconciler";

export const dynamic = "force-dynamic";

const poeEngine = new ProofOfExecutionEngine();
// In-memory challenge store for active challenges
const activeChallenges = new Map<string, any>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hardware = searchParams.get("hardware") || "nvidia-h100-80gb";
  const iterations = parseInt(searchParams.get("iterations") || "5000", 10);

  const challenge = poeEngine.issueChallenge(hardware, iterations);
  activeChallenges.set(challenge.challenge_id, challenge);

  return NextResponse.json(challenge);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const hardware = body.hardware || "nvidia-h100-80gb";
    const iterations = body.iterations || 5000;

    const challenge = poeEngine.issueChallenge(hardware, iterations);
    activeChallenges.set(challenge.challenge_id, challenge);

    return NextResponse.json(challenge, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
