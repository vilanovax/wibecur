'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Eye,
  RotateCcw,
  FileArchive,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AdminCard, Badge } from '@/components/admin/design-system';
import { GROUP_LABELS, type BackupImportPreview } from '@/lib/admin/backup/build-preview';

type RestoreReport = {
  totalUpserted: number;
  totalFailed: number;
  tables: { table: string; upserted: number; failed: number; errors: string[] }[];
};

type Props = {
  injectPreview?: BackupImportPreview | null;
  onInjectConsumed?: () => void;
};

export default function BackupImportPanel({ injectPreview, onInjectConsumed }: Props) {
  const [preview, setPreview] = useState<BackupImportPreview | null>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [report, setReport] = useState<RestoreReport | null>(null);

  const applyPreview = useCallback((data: BackupImportPreview) => {
    setPreview(data);
    setSelectedTables(
      data.tables.filter((t) => t.restorable).map((t) => t.key)
    );
    setError(null);
    setSuccess(null);
    setReport(null);
  }, []);

  useEffect(() => {
    if (injectPreview) {
      applyPreview(injectPreview);
      onInjectConsumed?.();
    }
  }, [injectPreview, applyPreview, onInjectConsumed]);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/backup/import', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? json.detail ?? 'خطا در بارگذاری');
        return;
      }
      applyPreview(json.data);
      setSuccess('فایل با موفقیت خوانده شد — جداول را بررسی و بازیابی کنید');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const toggleTable = (key: string) => {
    setSelectedTables((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const grouped = useMemo(() => {
    if (!preview) return [];
    const map = new Map<string, typeof preview.tables>();
    for (const t of preview.tables) {
      const list = map.get(t.group) ?? [];
      list.push(t);
      map.set(t.group, list);
    }
    return [...map.entries()];
  }, [preview]);

  const selectedRows = useMemo(() => {
    if (!preview) return 0;
    return preview.tables
      .filter((t) => selectedTables.includes(t.key))
      .reduce((s, t) => s + t.rowCount, 0);
  }, [preview, selectedTables]);

  const handleRestore = async () => {
    if (!preview) return;
    setRestoring(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/backup/import/${preview.sessionId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables: selectedTables, confirm: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? json.detail ?? 'خطا در بازیابی');
        return;
      }
      setReport(json.data.report);
      setSuccess(
        `بازیابی انجام شد: ${json.data.report.totalUpserted.toLocaleString('fa-IR')} ردیف · خطا: ${json.data.report.totalFailed.toLocaleString('fa-IR')}`
      );
      setConfirmOpen(false);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminCard padding="default" hover={false} className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)] dark:text-white">بارگذاری پشتیبان</h2>
          <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] mt-1 leading-relaxed">
            فایل ZIP یا JSON خروجی WibeCur را آپلود کنید. پیش از بازیابی، محتوا و تعداد ردیف‌ها
            نمایش داده می‌شود و می‌توانید جداول را انتخاب کنید.
          </p>
        </div>

        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={clsx(
            'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors',
            uploading
              ? 'border-violet-300 bg-violet-50/50 dark:bg-violet-900/10'
              : 'border-gray-200 dark:border-gray-600 hover:border-violet-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/40'
          )}
        >
          <input
            type="file"
            accept=".zip,.json,application/zip,application/json"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = '';
            }}
          />
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          ) : (
            <Upload className="h-8 w-8 text-[var(--color-text-subtle)]" />
          )}
          <span className="text-sm font-medium text-[var(--color-text)] dark:text-[var(--color-text-subtle)]">
            کلیک یا رها کردن فایل .zip / .json
          </span>
          <span className="text-xs text-[var(--color-text-subtle)]">حداکثر ۸۰ مگابایت</span>
        </label>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            {success}
          </p>
        )}
      </AdminCard>

      {preview && (
        <>
          <AdminCard padding="default" hover={false} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <FileArchive className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text)] dark:text-white">
                    پیش‌نمایش: {preview.fileName}
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {new Date(preview.manifest.createdAt).toLocaleString('fa-IR')} ·{' '}
                    {preview.totalRows.toLocaleString('fa-IR')} ردیف · {preview.tables.length}{' '}
                    جدول
                    {preview.mediaUrlCount > 0 &&
                      ` · ${preview.mediaUrlCount.toLocaleString('fa-IR')} URL تصویر`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setSelectedTables([]);
                  setReport(null);
                  setSuccess(null);
                }}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                بستن
              </button>
            </div>

            {preview.warnings.length > 0 && (
              <ul className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 space-y-1">
                {preview.warnings.map((w) => (
                  <li key={w}>• {w}</li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">
                {selectedTables.length} جدول · {selectedRows.toLocaleString('fa-IR')} ردیف انتخاب‌شده
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTables(preview.tables.filter((t) => t.restorable).map((t) => t.key))
                  }
                  className="text-xs text-violet-600 hover:underline"
                >
                  همه قابل بازیابی
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTables([])}
                  className="text-xs text-[var(--color-text-muted)] hover:underline"
                >
                  پاک
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
              {grouped.map(([group, tables]) => (
                <div key={group}>
                  <h3 className="text-[11px] font-medium text-[var(--color-text-subtle)] mb-2">
                    {GROUP_LABELS[group as keyof typeof GROUP_LABELS] ?? group}
                  </h3>
                  <ul className="space-y-2">
                    {tables.map((t) => (
                      <li
                        key={t.key}
                        className={clsx(
                          'rounded-xl border transition-colors',
                          selectedTables.includes(t.key)
                            ? 'border-violet-300 bg-violet-50/40 dark:border-violet-600 dark:bg-violet-900/15'
                            : 'border-gray-200 dark:border-gray-700'
                        )}
                      >
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <input
                            type="checkbox"
                            disabled={!t.restorable}
                            checked={selectedTables.includes(t.key)}
                            onChange={() => toggleTable(t.key)}
                            className="rounded text-violet-600"
                          />
                          <div className="flex-1 min-w-0 text-right">
                            <span className="text-sm font-medium text-[var(--color-text)] dark:text-gray-200">
                              {t.label}
                            </span>
                            <span className="text-xs text-[var(--color-text-subtle)] mr-2 font-mono">{t.key}</span>
                          </div>
                          <Badge variant="neutral">{t.rowCount.toLocaleString('fa-IR')}</Badge>
                          {!t.restorable && (
                            <span className="text-[10px] text-[var(--color-text-subtle)]">فقط نمایش</span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTable(expandedTable === t.key ? null : t.key)
                            }
                            className="p-1 text-[var(--color-text-subtle)] hover:text-violet-600"
                            aria-label="نمونه داده"
                          >
                            {expandedTable === t.key ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {expandedTable === t.key && t.sampleRows.length > 0 && (
                          <pre className="mx-3 mb-3 p-2 text-[10px] leading-relaxed overflow-x-auto rounded-lg bg-gray-900 text-gray-100 max-h-40">
                            {JSON.stringify(t.sampleRows, null, 2)}
                          </pre>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard padding="default" hover={false} variant="warning" className="space-y-3">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <strong>ادغام (merge):</strong> ردیف‌های موجود با همان id به‌روز می‌شوند؛ ردیف جدید
              اضافه می‌شود. داده‌ای حذف نمی‌شود. API key و رمز در فایل پشتیبان نیست.
            </p>
            {!confirmOpen ? (
              <button
                type="button"
                disabled={selectedTables.length === 0 || restoring}
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                بازیابی انتخاب‌شده‌ها
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-medium">مطمئنید؟ {selectedRows.toLocaleString('fa-IR')} ردیف</p>
                <button
                  type="button"
                  disabled={restoring}
                  onClick={() => void handleRestore()}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  بله، بازیابی کن
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="text-sm text-[var(--color-text-muted)] hover:underline"
                >
                  انصراف
                </button>
              </div>
            )}
          </AdminCard>

          {report && (
            <AdminCard padding="compact" hover={false}>
              <h3 className="text-xs font-semibold text-[var(--color-text)] dark:text-[var(--color-text-subtle)] mb-2 flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                گزارش بازیابی
              </h3>
              <ul className="text-xs space-y-1 text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">
                {report.tables.map((t) => (
                  <li key={t.table}>
                    <span className="font-mono">{t.table}</span>: {t.upserted} موفق
                    {t.failed > 0 && ` · ${t.failed} خطا`}
                  </li>
                ))}
              </ul>
            </AdminCard>
          )}
        </>
      )}
    </div>
  );
}
