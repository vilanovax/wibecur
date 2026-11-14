import type { PrismaClient } from '@prisma/client';
import { ingestListDocument, type IngestReport } from '@/lib/content/ingest-list';
import {
  isPreviewCommittable,
  loadIngestPreview,
  markIngestPreviewCommitted,
  saveIngestPreview,
} from '@/lib/content/ingest-preview-store';
import type { IngestDocument } from '@/lib/content/ingest-models';

export async function runIngestPreview(
  db: PrismaClient,
  document: IngestDocument
): Promise<IngestReport> {
  const report = await ingestListDocument(db, document, { dryRun: true });
  if (!report.ok) return report;

  const saved = await saveIngestPreview({
    document,
    listId: report.list?.id ?? null,
    listSlug: report.list?.slug ?? document.list.slug,
    listUpdatedAt: report.list?.updatedAt ?? null,
    categorySlug: report.categorySlug ?? document.categorySlug,
    dryRunReport: report,
  });

  return {
    ...report,
    previewId: saved.previewId,
    previewExpiresAt: saved.expiresAt,
    committable: isPreviewCommittable(report),
  };
}

export async function runIngestCommit(
  db: PrismaClient,
  previewId: string
): Promise<IngestReport> {
  const loaded = await loadIngestPreview(previewId);
  if (!loaded.ok) {
    return {
      ok: false,
      dryRun: false,
      code: loaded.code,
      error: loaded.error,
    };
  }

  const { record } = loaded;
  if (record.committed && record.commitReport) {
    return {
      ...record.commitReport,
      previewId: record.previewId,
      code: undefined,
    };
  }

  if (!isPreviewCommittable(record.dryRunReport)) {
    return {
      ok: false,
      dryRun: false,
      previewId: record.previewId,
      code: 'preview_has_errors',
      error: 'این preview قابل commit نیست',
      warnings: record.dryRunReport.warnings,
      rows: record.dryRunReport.rows,
    };
  }

  if (record.listId) {
    const list = await db.lists.findUnique({
      where: { id: record.listId },
      select: { id: true, updatedAt: true, deletedAt: true },
    });
    if (!list || list.deletedAt) {
      return {
        ok: false,
        dryRun: false,
        previewId: record.previewId,
        code: 'not_found',
        error: 'لیست این preview پیدا نشد',
      };
    }
    const current = list.updatedAt.toISOString();
    if (record.listUpdatedAt && record.listUpdatedAt !== current) {
      return {
        ok: false,
        dryRun: false,
        previewId: record.previewId,
        code: 'preview_stale',
        error: 'لیست بعد از preview تغییر کرده است. دوباره preview بگیرید.',
      };
    }
  }

  const report = await ingestListDocument(db, record.document, { dryRun: false });
  await markIngestPreviewCommitted(record.previewId, report);
  return {
    ...report,
    previewId: record.previewId,
  };
}
