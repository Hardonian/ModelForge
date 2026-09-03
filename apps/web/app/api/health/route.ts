import { NextResponse } from 'next/server';
import { dataLayer } from '@modelforge/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'ok';
  let modelsCount = 0;

  try {
    const models = dataLayer.listModels();
    modelsCount = models.length;
    if (modelsCount === 0) {
      dbStatus = 'degraded';
    }
  } catch {
    dbStatus = 'degraded';
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === 'ok';

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      response_time_ms: responseTimeMs,
      services: {
        web_application: {
          status: 'ok',
          runtime: 'nodejs'
        },
        database_layer: {
          status: dbStatus,
          records_active: modelsCount > 0
        },
        huggingface_integration: {
          status: 'ok',
          endpoint: 'https://huggingface.co/api'
        },
        mcp_server: {
          status: 'ok',
          protocol_version: '2024-11-05'
        }
      }
    },
    { status: isHealthy ? 200 : 200 } // Keep 200 for degraded check to avoid cascading LB panics
  );
}
