import { NextResponse } from 'next/server';
import { dataLayer } from '@modelforge/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  const matrix = dataLayer.getSupportMatrix();
  return NextResponse.json(matrix);
}
