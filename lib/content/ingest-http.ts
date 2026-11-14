/** تنها حالت پشتیبانی‌شده: افزودن به انتهای لیست موجود (بدون جایگزینی اعضا). */
export const INGEST_LIST_MODE_ADD_ONLY = 'add_only' as const;
export type IngestListMode = typeof INGEST_LIST_MODE_ADD_ONLY;

/** بدنهٔ POST بات: همان سند ingest به‌اضافهٔ dryRun اجباری و mode اختیاری. */
export function readIngestHttpBody(
  raw: unknown
):
  | { ok: true; dryRun: boolean; mode: IngestListMode; document: unknown }
  | { ok: false; error: string } {
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

  if (record.mode !== undefined && record.mode !== INGEST_LIST_MODE_ADD_ONLY) {
    return {
      ok: false,
      error:
        'فقط mode: «add_only» مجاز است. ورود به لیست موجود اعضا را جایگزین نمی‌کند؛ آیتم‌های ارسالی به انتها اضافه می‌شوند و تکراری دوبله نمی‌شود.',
    };
  }

  const { dryRun, mode: _mode, ...document } = record;
  return {
    ok: true,
    dryRun,
    mode: INGEST_LIST_MODE_ADD_ONLY,
    document,
  };
}

export function publicIngestError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  return /[\u0600-\u06FF]/.test(message) ? message : 'خطا در ورود داده';
}
