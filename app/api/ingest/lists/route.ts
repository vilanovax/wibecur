import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeIngest } from '@/lib/content/ingest-auth';
import { publicIngestError, readIngestHttpBody } from '@/lib/content/ingest-http';
import { parseIngestDocument } from '@/lib/content/ingest-models';
import { ingestListDocument } from '@/lib/content/ingest-list';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** POST /api/ingest/lists — ساخت یا به‌روزرسانی لیست و ورود آیتم‌ها. */
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

  try {
    const report = await ingestListDocument(prisma, parsed.document, {
      dryRun: split.dryRun,
    });
    const status = report.ok ? 200 : report.error?.includes('پیدا نشد') ? 404 : 400;
    return NextResponse.json(report, { status });
  } catch (error) {
    console.error('ingest lists:', error);
    return NextResponse.json({ ok: false, error: publicIngestError(error) }, { status: 500 });
  }
}
