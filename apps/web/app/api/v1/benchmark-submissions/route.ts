import { NextRequest, NextResponse } from 'next/server';
import { OpenComputeBenchSchema, validateBenchmarkIntegrity } from '@modelforge/benchmark-schema';
import { dataLayer } from '@modelforge/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = OpenComputeBenchSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Schema validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const record = parsed.data;
    const { isValid, errors } = validateBenchmarkIntegrity(record);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Benchmark cryptographic integrity verification failed', details: errors },
        { status: 422 }
      );
    }

    // Save record to storage layer
    dataLayer.addBenchmark(record);

    return NextResponse.json(
      {
        status: 'accepted',
        benchmark_id: record.benchmark_id,
        verification_status: record.verification.status,
        url: `https://modelforge.dev/benchmarks/${record.benchmark_id}`
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Internal processing error', message: err.message },
      { status: 500 }
    );
  }
}
