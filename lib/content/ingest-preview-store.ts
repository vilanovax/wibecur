import { nanoid } from 'nanoid';
import { ingestKvDel, ingestKvGet, ingestKvSet } from '@/lib/content/ingest-kv';
import type { IngestDocument } from '@/lib/content/ingest-models';
import type { IngestReport } from '@/lib/content/ingest-list';

/** عمر پیشنهادی مشخصات: ۳۰ دقیقه */
export const INGEST_PREVIEW_TTL_SECONDS = 30 * 60;

export type IngestPreviewRecord = {
  previewId: string;
  createdAt: string;
  expiresAt: string;
  document: IngestDocument;
  listId: string | null;
  listSlug: string;
  /** ISO updatedAt لیست هنگام preview — برای تشخیص stale */
  listUpdatedAt: string | null;
  categorySlug: string;
  dryRunReport: IngestReport;
  committed: boolean;
  commitReport?: IngestReport;
};

function previewKey(previewId: string): string {
  return `wibe:ingest:preview:${previewId}`;
}

export async function saveIngestPreview(opts: {
  document: IngestDocument;
  listId: string | null;
  listSlug: string;
  listUpdatedAt: string | null;
  categorySlug: string;
  dryRunReport: IngestReport;
}): Promise<IngestPreviewRecord> {
  const previewId = `prev_${nanoid(16)}`;
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + INGEST_PREVIEW_TTL_SECONDS * 1000);
  const record: IngestPreviewRecord = {
    previewId,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    document: opts.document,
    listId: opts.listId,
    listSlug: opts.listSlug,
    listUpdatedAt: opts.listUpdatedAt,
    categorySlug: opts.categorySlug,
    dryRunReport: opts.dryRunReport,
    committed: false,
  };
  await ingestKvSet(previewKey(previewId), record, INGEST_PREVIEW_TTL_SECONDS);
  return record;
}

export async function loadIngestPreview(
  previewId: string
): Promise<
  | { ok: true; record: IngestPreviewRecord }
  | { ok: false; status: 404 | 410; code: string; error: string }
> {
  const id = previewId.trim();
  if (!id) {
    return { ok: false, status: 404, code: 'not_found', error: 'preview پیدا نشد' };
  }
  const record = await ingestKvGet<IngestPreviewRecord>(previewKey(id));
  if (!record) {
    return {
      ok: false,
      status: 410,
      code: 'preview_expired',
      error: 'preview منقضی شده یا پیدا نشد',
    };
  }
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    await ingestKvDel(previewKey(id));
    return {
      ok: false,
      status: 410,
      code: 'preview_expired',
      error: 'preview منقضی شده است',
    };
  }
  return { ok: true, record };
}

export async function markIngestPreviewCommitted(
  previewId: string,
  commitReport: IngestReport
): Promise<IngestPreviewRecord | null> {
  const loaded = await loadIngestPreview(previewId);
  if (!loaded.ok) return null;
  const record: IngestPreviewRecord = {
    ...loaded.record,
    committed: true,
    commitReport,
  };
  const remainingMs = new Date(record.expiresAt).getTime() - Date.now();
  const ttl = Math.max(60, Math.ceil(remainingMs / 1000));
  await ingestKvSet(previewKey(previewId), record, ttl);
  return record;
}

export function isPreviewCommittable(report: IngestReport): boolean {
  return report.ok === true && (report.summary?.invalid ?? 0) === 0;
}
