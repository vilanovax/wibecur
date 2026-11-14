import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeIngest } from '@/lib/content/ingest-auth';
import { publicIngestError, readIngestHttpBody } from '@/lib/content/ingest-http';
import { parseIngestDocument } from '@/lib/content/ingest-models';
import { ingestListDocument } from '@/lib/content/ingest-list';
import { runIngestPreview } from '@/lib/content/ingest-commit';
import {
  beginIdempotency,
  completeIdempotency,
  hashIngestBody,
  readIdempotencyKey,
} from '@/lib/content/ingest-idempotency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const PATH = '/api/ingest/lists';

/**
 * POST /api/ingest/lists
 * - dryRun:true → پیش‌نمایش + previewId (برای commit)
 * - dryRun:false → نوشتن مستقیم (سازگاری با بات‌های قدیمی؛ Idempotency-Key اجباری)
 * مسیر توصیه‌شده: preview → POST /api/ingest/lists/commit
 */
export async function POST(request: Request) {
  const authResult = authorizeIngest(request);
  if (!authResult.ok) {
    return NextResponse.json({ ok: false, error: authResult.error }, { status: authResult.status });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON نامعتبر است' }, { status: 400 });
  }

  const split = readIngestHttpBody(raw);
  if (!split.ok) {
    return NextResponse.json({ ok: false, error: split.error }, { status: 400 });
  }

  const parsed = parseIngestDocument(split.document);
  if (!parsed.ok) {
    return NextResponse.json(
      {
        ok: false,
        dryRun: split.dryRun,
        error: 'JSON با مدل این دسته جور نیست. چیزی نوشته نشد.',
        issues: parsed.issues,
      },
      { status: 400 }
    );
  }

  // نوشتن مستقیم هنوز پشتیبانی می‌شود ولی باید Idempotency-Key داشته باشد
  if (!split.dryRun) {
    const idemKey = readIdempotencyKey(request);
    if (!idemKey.ok) {
      return NextResponse.json(
        { ok: false, code: idemKey.code, error: idemKey.error },
        { status: idemKey.status }
      );
    }

    const bodyHash = hashIngestBody(raw);
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
      return NextResponse.json(begun.record.body, {
        status: begun.record.status || 200,
        headers: { 'Idempotent-Replayed': 'true' },
      });
    }

    try {
      const report = await ingestListDocument(prisma, parsed.document, { dryRun: false });
      const status = report.ok ? 200 : report.error?.includes('پیدا نشد') ? 404 : 400;
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
      console.error('ingest lists:', error);
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

  try {
    const report = await runIngestPreview(prisma, parsed.document);
    const status = report.ok ? 200 : report.error?.includes('پیدا نشد') ? 404 : 400;
    return NextResponse.json(report, { status });
  } catch (error) {
    console.error('ingest lists preview:', error);
    return NextResponse.json({ ok: false, error: publicIngestError(error) }, { status: 500 });
  }
}
