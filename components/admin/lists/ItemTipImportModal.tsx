'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardPaste,
  FileJson,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import {
  ITEM_TIP_JSON_EXAMPLE,
  tryParseItemTipImportPayload,
  type ItemTipImportItem,
} from '@/lib/admin/item-tip-import';
import type { BulkImportProgress } from '@/lib/admin/bulk-json-import-client';
import BulkJsonImportProgress from '@/components/admin/shared/BulkJsonImportProgress';

type Props = {
  importing: boolean;
  importProgress: BulkImportProgress;
  onClose: () => void;
  onImport: (payload: { items: ItemTipImportItem[] }) => Promise<void>;
};

type ParseState =
  | { status: 'empty' }
  | { status: 'invalid'; error: string }
  | { status: 'valid'; items: ItemTipImportItem[] };

function parseImportJson(text: string): ParseState {
  const trimmed = text.trim();
  if (!trimmed) return { status: 'empty' };
  try {
    const raw = JSON.parse(trimmed) as unknown;
    const result = tryParseItemTipImportPayload(raw);
    if (!result.success) return { status: 'invalid', error: result.error };
    if (result.data.items.length === 0) {
      return { status: 'invalid', error: 'هیچ آیتم معتبری در JSON پیدا نشد' };
    }
    return { status: 'valid', items: result.data.items };
  } catch {
    return { status: 'invalid', error: 'JSON نامعتبر است — syntax را بررسی کنید' };
  }
}

export default function ItemTipImportModal({
  importing,
  importProgress,
  onClose,
  onImport,
}: Props) {
  const [json, setJson] = useState('');
  const [debouncedJson, setDebouncedJson] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedJson(json), 250);
    return () => window.clearTimeout(timer);
  }, [json]);

  const parseState = useMemo(() => parseImportJson(debouncedJson), [debouncedJson]);

  const handleImport = async () => {
    if (parseState.status !== 'valid') return;
    await onImport({ items: parseState.items });
  };

  const isRunning = importing || importProgress.phase === 'running';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-2 sm:items-center sm:p-4">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--color-text)]">ورود JSON نکته‌ها (tip)</h2>
              <p className="text-xs text-[var(--color-text-muted)]">فقط فیلد tip به‌روز می‌شود</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="rounded-lg p-1.5 hover:bg-[var(--color-bg)] disabled:opacity-40"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2 sm:px-5">
          {parseState.status === 'valid' ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {parseState.items.length.toLocaleString('fa-IR')} آیتم آماده import
            </span>
          ) : parseState.status === 'invalid' ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {parseState.error}
            </span>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">JSON را در کادر زیر وارد کنید</span>
          )}
          <button
            type="button"
            onClick={() => setJson(JSON.stringify(ITEM_TIP_JSON_EXAMPLE, null, 2))}
            className="mr-auto inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium hover:bg-[var(--color-bg)]"
          >
            <FileJson className="h-3.5 w-3.5" />
            نمونه
          </button>
        </div>

        <BulkJsonImportProgress
          progress={importProgress}
          runningLabel="در حال اعمال tipها…"
          doneLabel="اعمال tipها تمام شد"
        />

        <div className="flex-1 overflow-hidden p-4 sm:p-5">
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            disabled={isRunning}
            dir="ltr"
            spellCheck={false}
            placeholder='{ "items": [ { "id": "...", "tip": "..." } ] }'
            className="h-[min(52vh,420px)] w-full resize-y rounded-xl border bg-[var(--color-bg)]/40 p-3 font-mono text-xs leading-relaxed text-left"
          />
        </div>

        <footer className="flex justify-between gap-2 border-t border-[var(--color-border)] px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-[var(--color-bg)] disabled:opacity-40"
          >
            {importProgress.phase === 'done' ? 'بستن' : 'انصراف'}
          </button>
          <button
            type="button"
            disabled={parseState.status !== 'valid' || isRunning}
            onClick={() => void handleImport()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardPaste className="h-4 w-4" />}
            {isRunning
              ? `${importProgress.processed.toLocaleString('fa-IR')} / ${importProgress.total.toLocaleString('fa-IR')}`
              : 'اعمال tipها'}
          </button>
        </footer>
      </div>
    </div>
  );
}
