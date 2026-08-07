'use client';

import type { BulkImportProgress } from '@/lib/admin/bulk-json-import-client';

type Props = {
  progress: BulkImportProgress;
  runningLabel: string;
  doneLabel: string;
};

export default function BulkJsonImportProgress({
  progress,
  runningLabel,
  doneLabel,
}: Props) {
  if (progress.phase === 'idle') return null;

  const percent =
    progress.total > 0 ? Math.min(100, Math.round((progress.processed / progress.total) * 100)) : 0;

  return (
    <div className="space-y-2 border-b border-[var(--color-border)] bg-emerald-50/40 px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-[var(--color-text)]">
          {progress.phase === 'running' ? runningLabel : doneLabel}
        </span>
        <span className="tabular-nums text-[var(--color-text-muted)]">
          {progress.processed.toLocaleString('fa-IR')} / {progress.total.toLocaleString('fa-IR')}
          <span className="mx-1">·</span>
          {percent.toLocaleString('fa-IR')}٪
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-emerald-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        <span className="font-medium text-emerald-800 tabular-nums">
          {progress.updated.toLocaleString('fa-IR')} به‌روز شد
        </span>
        <span className="text-[var(--color-text-muted)] tabular-nums">
          {progress.skipped.toLocaleString('fa-IR')} بدون تغییر
        </span>
        {progress.failed > 0 ? (
          <span className="font-medium text-red-700 tabular-nums">
            {progress.failed.toLocaleString('fa-IR')} خطا
          </span>
        ) : null}
      </div>

      {progress.errors.length > 0 ? (
        <ul className="max-h-24 space-y-0.5 overflow-y-auto text-[11px] text-red-700">
          {progress.errors.slice(0, 8).map((error) => (
            <li key={error} className="truncate" title={error}>
              {error}
            </li>
          ))}
          {progress.errors.length > 8 ? (
            <li className="text-[var(--color-text-muted)]">
              +{(progress.errors.length - 8).toLocaleString('fa-IR')} خطای دیگر
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
