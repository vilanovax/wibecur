import { NextResponse } from 'next/server';
import { authorizeIngest } from '@/lib/content/ingest-auth';
import { renderIngestModels } from '@/lib/content/ingest-models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/ingest/models — مدل هر دسته برای بات. */
export async function GET(request: Request) {
  const authResult = authorizeIngest(request);
  if (!authResult.ok) {
    return NextResponse.json({ ok: false, error: authResult.error }, { status: authResult.status });
  }

  return NextResponse.json({ ok: true, ...renderIngestModels() });
}
