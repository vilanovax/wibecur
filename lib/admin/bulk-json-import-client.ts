export type BulkImportProgress = {
  phase: 'idle' | 'running' | 'done';
  total: number;
  processed: number;
  updated: number;
  failed: number;
  skipped: number;
  errors: string[];
};

export const INITIAL_BULK_IMPORT_PROGRESS: BulkImportProgress = {
  phase: 'idle',
  total: 0,
  processed: 0,
  updated: 0,
  failed: 0,
  skipped: 0,
  errors: [],
};

type ImportApiResult = {
  updated?: number;
  skipped?: number;
  failed?: number;
  errors?: string[];
};

export async function runBatchedJsonImport<T>(options: {
  items: T[];
  batchSize?: number;
  endpoint: string;
  buildBody: (batch: T[]) => object;
  onProgress: (progress: BulkImportProgress) => void;
  signal?: AbortSignal;
}): Promise<BulkImportProgress> {
  const batchSize = options.batchSize ?? 15;
  const total = options.items.length;

  let processed = 0;
  let updated = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  const emit = (phase: BulkImportProgress['phase']) => {
    options.onProgress({
      phase,
      total,
      processed,
      updated,
      failed,
      skipped,
      errors: [...errors],
    });
  };

  emit('running');

  for (let index = 0; index < options.items.length; index += batchSize) {
    if (options.signal?.aborted) {
      throw new Error('import لغو شد');
    }

    const batch = options.items.slice(index, index + batchSize);
    const res = await fetch(options.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options.buildBody(batch)),
      signal: options.signal,
    });

    const body = (await res.json()) as { error?: string; data?: ImportApiResult };
    if (!res.ok) {
      throw new Error(body.error || 'خطا در import');
    }

    processed += batch.length;
    updated += body.data?.updated ?? 0;
    failed += body.data?.failed ?? 0;
    skipped += body.data?.skipped ?? 0;
    if (Array.isArray(body.data?.errors)) {
      errors.push(...body.data.errors);
    }

    emit('running');
  }

  const finalProgress: BulkImportProgress = {
    phase: 'done',
    total,
    processed,
    updated,
    failed,
    skipped,
    errors,
  };
  options.onProgress(finalProgress);
  return finalProgress;
}
