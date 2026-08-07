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
  LIST_DESCRIPTION_JSON_EXAMPLE,
  tryParseListDescriptionImportPayload,
  type ListDescriptionImportItem,
} from '@/lib/admin/list-description-import';
import type { BulkImportProgress } from '@/lib/admin/bulk-json-import-client';
import BulkJsonImportProgress from '@/components/admin/shared/BulkJsonImportProgress';

type Props = {
  initialJson?: string;
  importing: boolean;
  importProgress: BulkImportProgress;
  onClose: () => void;
  onImport: (payload: { lists: ListDescriptionImportItem[] }) => Promise<void>;
};

type ParseState =
  | { status: 'empty' }
  | { status: 'invalid'; error: string }
  | { status: 'valid'; lists: ListDescriptionImportItem[] };

function parseImportJson(text: string): ParseState {
  const trimmed = text.trim();
  if (!trimmed) return { status: 'empty' };
  try {
    const raw = JSON.parse(trimmed) as unknown;
    const result = tryParseListDescriptionImportPayload(raw);
    if (!result.success) return { status: 'invalid', error: result.error };
    if (result.data.lists.length === 0) {
      return { status: 'invalid', error: 'هیچ لیست معتبری در JSON پیدا نشد' };
    }
    return { status: 'valid', lists: result.data.lists };
  } catch {
    return { status: 'invalid', error: 'JSON نامعتبر است — syntax را بررسی کنید' };
  }
}

export default function ListDescriptionImportModal({
  initialJson = '',
  importing,
  importProgress,
  onClose,
  onImport,
}: Props) {
  const [json, setJson] = useState(initialJson);
  const [debouncedJson, setDebouncedJson] = useState(initialJson);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedJson(json), 250);
    return () => window.clearTimeout(timer);
  }, [json]);

  const parseState = useMemo(() => parseImportJson(debouncedJson), [debouncedJson]);

  const handlePasteExample = () => {
    setJson(JSON.stringify(LIST_DESCRIPTION_JSON_EXAMPLE, null, 2));
  };

  const handleImport = async () => {
    if (parseState.status !== 'valid') return;
    await onImport({ lists: parseState.lists });
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
              <h2 className="font-bold text-[var(--color-text)]">ورود JSON توضیحات لیست‌ها</h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                خروجی هوش مصنوعی را بچسبانید — فقط description به‌روز می‌شود
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] disabled:opacity-40"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2 sm:px-5">
          {parseState.status === 'valid' ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {parseState.lists.length.toLocaleString('fa-IR')} لیست آماده import
            </span>
          ) : parseState.status === 'invalid' ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {parseState.error}
            </span>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">JSON را در کادر زیر وارد کنید</span>
          )}
          <div className="mr-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handlePasteExample}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2 py-1 text-[11px] font-medium hover:bg-[var(--color-bg)]"
            >
              <FileJson className="h-3.5 w-3.5" />
              نمونه
            </button>
          </div>
        </div>

        <BulkJsonImportProgress
          progress={importProgress}
          runningLabel="در حال اعمال توضیحات…"
          doneLabel="اعمال توضیحات تمام شد"
        />

        <div className="flex-1 overflow-hidden p-4 sm:p-5">
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            disabled={isRunning}
            dir="ltr"
            spellCheck={false}
            placeholder='{ "lists": [ { "id": "...", "description": "..." } ] }'
            className="h-[min(52vh,420px)] w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-3 font-mono text-xs leading-relaxed text-left"
          />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-bg)] disabled:opacity-40"
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
              : 'اعمال توضیحات'}
          </button>
        </footer>
      </div>
    </div>
  );
}
