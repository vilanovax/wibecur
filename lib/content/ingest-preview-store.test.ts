import { afterEach, describe, expect, it } from 'vitest';
import { resetIngestKvMemoryForTests } from '@/lib/content/ingest-kv';
import {
  isPreviewCommittable,
  loadIngestPreview,
  markIngestPreviewCommitted,
  saveIngestPreview,
} from '@/lib/content/ingest-preview-store';
import type { IngestDocument } from '@/lib/content/ingest-models';
import type { IngestReport } from '@/lib/content/ingest-list';

const document: IngestDocument = {
  categorySlug: 'movies',
  kind: 'movie',
  list: { title: 'لیست', slug: 'preview-test' },
  items: [],
  warnings: [],
};

const dryRunReport: IngestReport = {
  ok: true,
  dryRun: true,
  list: { action: 'create', slug: 'preview-test', title: 'لیست', updatedAt: null },
  summary: { total: 0, invalid: 0, created: 0, linked: 0, updated: 0, lightweight: 0 },
  committable: true,
};

describe('ingest preview store', () => {
  afterEach(() => {
    resetIngestKvMemoryForTests();
  });

  it('saves and loads a preview', async () => {
    const saved = await saveIngestPreview({
      document,
      listId: null,
      listSlug: 'preview-test',
      listUpdatedAt: null,
      categorySlug: 'movies',
      dryRunReport,
    });
    expect(saved.previewId.startsWith('prev_')).toBe(true);
    expect(isPreviewCommittable(dryRunReport)).toBe(true);

    const loaded = await loadIngestPreview(saved.previewId);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.record.document.list.slug).toBe('preview-test');
  });

  it('marks a preview as committed for replay', async () => {
    const saved = await saveIngestPreview({
      document,
      listId: null,
      listSlug: 'preview-test',
      listUpdatedAt: null,
      categorySlug: 'movies',
      dryRunReport,
    });
    const commitReport: IngestReport = {
      ok: true,
      dryRun: false,
      list: { action: 'create', id: 'list1', slug: 'preview-test', title: 'لیست' },
      summary: { total: 0, invalid: 0, created: 0, linked: 0, updated: 0, lightweight: 0 },
    };
    const marked = await markIngestPreviewCommitted(saved.previewId, commitReport);
    expect(marked?.committed).toBe(true);

    const loaded = await loadIngestPreview(saved.previewId);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.record.commitReport?.list?.id).toBe('list1');
  });

  it('returns expired when preview is missing', async () => {
    const missing = await loadIngestPreview('prev_missing');
    expect(missing).toMatchObject({ ok: false, status: 410, code: 'preview_expired' });
  });
});
