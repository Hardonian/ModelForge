import { NextRequest, NextResponse } from 'next/server';
import { computeModelFit, ModelFitInputSchema } from '@modelforge/model-fit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = ModelFitInputSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid ModelFit parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const fit = computeModelFit(parsed.data);
    return NextResponse.json(fit);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'ModelFit scoring calculation failed', message: err.message },
      { status: 500 }
    );
  }
}
