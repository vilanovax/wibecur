import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeIngest } from '@/lib/content/ingest-auth';
import { publicIngestError } from '@/lib/content/ingest-http';
import { runIngestCommit } from '@/lib/content/ingest-commit';
import {
  beginIdempotency,
  completeIdempotency,
  hashIngestBody,
  readIdempotencyKey,
} from '@/lib/content/ingest-idempotency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const PATH = '/api/ingest/lists/commit';

/**
 * POST /api/ingest/lists/commit
 * بدنه: { previewId } — اجرای همان پیش‌نمایش ذخیره‌شده.
 * هدر Idempotency-Key اجباری است.
 */
export async function POST(request: Request) {
  const authResult = authorizeIngest(request);
  if (!authResult.ok) {
    return NextResponse.json({ ok: false, error: authResult.error }, { status: authResult.status });
  }

  const idemKey = readIdempotencyKey(request);
  if (!idemKey.ok) {
    return NextResponse.json(
      { ok: false, code: idemKey.code, error: idemKey.error },
      { status: idemKey.status }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON نامعتبر است' }, { status: 400 });
  }

  const previewId =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? String((raw as Record<string, unknown>).previewId ?? '').trim()
      : '';
  if (!previewId) {
    return NextResponse.json(
      { ok: false, code: 'bad_request', error: 'previewId الزامی است' },
      { status: 400 }
    );
  }

  const bodyHash = hashIngestBody({ previewId });
  const begun = await beginIdempotency({
    method: 'POST',
    path: PATH,
    key: idemKey.key,
    bodyHash,
  });
  if (!begun.ok) {
    return NextResponse.json(
      { ok: false, code: begun.code, error: begun.error },
      { status: begun.status }
    );
  }
  if (!begun.fresh) {
    const headers = new Headers({ 'Idempotent-Replayed': 'true' });
    return NextResponse.json(begun.record.body, {
      status: begun.record.status || 200,
      headers,
    });
  }

  try {
    const report = await runIngestCommit(prisma, previewId);
    const status =
      report.ok
        ? 200
        : report.code === 'preview_expired'
          ? 410
          : report.code === 'preview_stale' || report.code === 'idempotency_in_progress'
            ? 409
            : report.code === 'not_found'
              ? 404
              : 400;
    await completeIdempotency({
      method: 'POST',
      path: PATH,
      key: idemKey.key,
      bodyHash,
      status,
      body: report,
    });
    return NextResponse.json(report, { status });
  } catch (error) {
    console.error('ingest commit:', error);
    const body = { ok: false, error: publicIngestError(error) };
    await completeIdempotency({
      method: 'POST',
      path: PATH,
      key: idemKey.key,
      bodyHash,
      status: 500,
      body,
    });
    return NextResponse.json(body, { status: 500 });
  }
}
