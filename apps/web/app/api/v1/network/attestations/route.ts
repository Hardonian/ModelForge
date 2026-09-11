import { NextRequest, NextResponse } from "next/server";
import { ProofOfExecutionEngine } from "@modelforge/reconciler";
import { ProofOfExecutionSchema, HardwareSpecSchema } from "@modelforge/benchmark-schema";

export const dynamic = "force-dynamic";

const poeEngine = new ProofOfExecutionEngine();
const attestationsStore = new Map<string, any>();

export async function GET() {
  return NextResponse.json(Array.from(attestationsStore.values()));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challenge, proof, hardware } = body;

    if (!challenge || !proof || !hardware) {
      return NextResponse.json(
        { error: "Missing challenge, proof, or hardware specification in payload" },
        { status: 400 },
      );
    }

    const parsedProof = ProofOfExecutionSchema.safeParse(proof);
    const parsedHardware = HardwareSpecSchema.safeParse(hardware);

    if (!parsedProof.success || !parsedHardware.success) {
      return NextResponse.json(
        { error: "Invalid proof or hardware schema format" },
        { status: 400 },
      );
    }

    const attestation = poeEngine.verifyProof(
      challenge,
      parsedProof.data,
      parsedHardware.data,
    );

    attestationsStore.set(attestation.attestation_id, attestation);

    return NextResponse.json(attestation, {
      status: attestation.verified ? 200 : 422,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
