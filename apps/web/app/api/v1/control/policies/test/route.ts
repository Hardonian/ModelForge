import { NextRequest, NextResponse } from "next/server";
import { PolicyEngine } from "@modelforge/reconciler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { policy, action } = body;

    if (!policy || !action) {
      return NextResponse.json(
        { error: "Both 'policy' and 'action' are required in request body" },
        { status: 400 }
      );
    }

    const evaluation = PolicyEngine.evaluateAction(action, policy);
    return NextResponse.json(evaluation);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
