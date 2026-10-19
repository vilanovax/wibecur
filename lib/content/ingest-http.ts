/** بدنهٔ POST بات: همان سند ingest به‌اضافهٔ dryRun اجباری. */
export function readIngestHttpBody(
  raw: unknown
): { ok: true; dryRun: boolean; document: unknown } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'بدنه باید یک شیء JSON باشد' };
  }

  const record = raw as Record<string, unknown>;
  if (typeof record.dryRun !== 'boolean') {
    return {
      ok: false,
      error: 'dryRun الزامی است. true فقط پیش‌نمایش است و false می‌نویسد.',
    };
  }

  const { dryRun, ...document } = record;
  return { ok: true, dryRun, document };
}

export function publicIngestError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  return /[\u0600-\u06FF]/.test(message) ? message : 'خطا در ورود داده';
}
