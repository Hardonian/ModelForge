import { NextRequest, NextResponse } from "next/server";
import {
  solveWorkloadOptimization,
  OptimizerQuerySchema,
} from "@modelforge/optimizer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = OptimizerQuerySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid optimization query parameters",
          details: parsed.error.format(),
        },
        { status: 400 },
      );
    }

    const result = solveWorkloadOptimization(parsed.data);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Optimizer solver error", message: err.message },
      { status: 500 },
    );
  }
}
