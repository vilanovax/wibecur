'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  FileJson,
  Upload,
  CheckSquare,
  Square,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileUp,
  Info,
  Link2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { BulkImportMatchKind } from '@/lib/admin/bulk-import-resolve';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import {
  parseBulkImportJson,
  getBulkImportJsonExample,
  getBulkImportJsonHint,
  getBulkImportFormatTitle,
  getBulkImportCategoryKind,
  getBulkImportCategoryLabel,
  formatBulkImportRowSubtitle,
  type BulkImportRow,
  type BulkImportListContext,
} from '@/lib/admin/bulk-import';
import BulkImportMetadataEditor, {
  bulkImportFallbackIcon,
} from '@/components/admin/items/BulkImportMetadataEditor';
import BulkImportConfirmDialog from '@/components/admin/items/BulkImportConfirmDialog';
import { BOOK_EXTRACT_IMPORT_KEY } from '@/lib/books/constants';

type CategoryOption = { id: string; name: string; slug: string; icon: string | null; isActive?: boolean };
type ListOption = {
  id: string;
  title: string;
  slug: string;
  categoryId: string | null;
  itemCount: number;
  createdAt: string;
  categories: { id: string; name: string; slug: string; icon: string | null } | null;
};

const IMPORT_BATCH_SIZE = 25;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function rowToPayload(r: BulkImportRow) {
  const entryKind = r.metadata.entryKind;
  return {
    title: r.title,
    description: r.description || undefined,
    imageUrl: r.imageUrl || undefined,
    externalUrl: r.externalUrl || undefined,
    order: r.order,
    entryKind: typeof entryKind === 'string' ? entryKind : undefined,
    metadata: Object.keys(r.metadata).length ? r.metadata : undefined,
  };
}

export default function BulkImportClient({
  categories,
  lists,
  initialListId,
  initialCategoryId,
  embedded = false,
}: {
  categories: CategoryOption[];
  lists: ListOption[];
  initialListId?: string;
  initialCategoryId?: string;
  embedded?: boolean;
}) {
  const router = useRouter();
  const initialList = initialListId ? lists.find((l) => l.id === initialListId) : null;
  const [categoryId, setCategoryId] = useState(
    initialCategoryId ||
      initialList?.categoryId ||
      categories[0]?.id ||
      ''
  );
  const [listId, setListId] = useState(initialListId || '');
  const [jsonText, setJsonText] = useState('');
  const [rows, setRows] = useState<BulkImportRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState<{
    imported: number;
    created?: number;
    linked?: number;
    updated?: number;
    results: { index: number; title: string; status: string; message?: string }[];
  } | null>(null);
  const [error, setError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [summary, setSummary] = useState<{
    new: number;
    existing_catalog: number;
    already_in_list: number;
    lightweight?: number;
  } | null>(null);
  const [matchFilter, setMatchFilter] = useState<'all' | BulkImportMatchKind>('all');
  const [jsonCollapsed, setJsonCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<{
    done: number;
    total: number;
    batch: number;
    batchCount: number;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BOOK_EXTRACT_IMPORT_KEY);
      if (!raw) return;
      sessionStorage.removeItem(BOOK_EXTRACT_IMPORT_KEY);
      setJsonText(JSON.stringify(JSON.parse(raw), null, 2));
      setLoadedFileName('book-extract.json');
    } catch {
      // ignore invalid payload
    }
  }, []);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const categorySlug = selectedCategory?.slug ?? 'general';
  const categoryKind = getBulkImportCategoryKind(categorySlug);

  const listCountByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of lists) {
      if (l.categoryId) m.set(l.categoryId, (m.get(l.categoryId) ?? 0) + 1);
    }
    return m;
  }, [lists]);

  const filteredLists = useMemo(
    () =>
      lists
        .filter((l) => l.categoryId === categoryId)
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [lists, categoryId]
  );

  const selectedList = lists.find((l) => l.id === listId);

  const listContext: BulkImportListContext | null = useMemo(
    () =>
      selectedList || selectedCategory
        ? {
            title: selectedList?.title,
            slug: selectedList?.slug,
            categoryName: selectedCategory?.name,
          }
        : null,
    [selectedList, selectedCategory]
  );
  const selectedCount = rows.filter((r) => r.selected && r.valid).length;

  const displayRows = useMemo(
    () =>
      rows.filter(
        (r) => matchFilter === 'all' || r.match?.kind === matchFilter || !r.match
      ),
    [rows, matchFilter]
  );

  const enrichWithPreview = useCallback(
    async (parsed: BulkImportRow[]) => {
      if (!listId) {
        setRows(parsed);
        setSummary(null);
        return;
      }
      setPreviewLoading(true);
      try {
        const res = await fetch('/api/admin/items/bulk-import/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listId,
            items: parsed.map(rowToPayload),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا در تطبیق');
        setRows(
          parsed.map((r, i) => ({
            ...r,
            match: data.matches[i],
          }))
        );
        setSummary(data.summary);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'خطا در تطبیق کاتالوگ');
        setRows(parsed);
        setSummary(null);
      } finally {
        setPreviewLoading(false);
      }
    },
    [listId]
  );

  const applyParsedJson = useCallback(
    async (text: string, slug: string = categorySlug, withCatalogMatch = true) => {
      setParseError('');
      setImportDone(null);
      setSummary(null);
      const { rows: parsed, parseError: pe } = parseBulkImportJson(text, slug);
      if (pe) {
        setParseError(pe);
        setRows([]);
        return false;
      }
      if (parsed.length > 0) setExpandedId(parsed[0].id);
      setJsonCollapsed(true);
      if (withCatalogMatch && listId) {
        await enrichWithPreview(parsed);
      } else {
        setRows(parsed);
      }
      return true;
    },
    [enrichWithPreview, categorySlug, listId]
  );

  const handleParse = useCallback(() => {
    void applyParsedJson(jsonText, categorySlug);
  }, [jsonText, applyParsedJson, categorySlug]);

  useEffect(() => {
    if (rows.length > 0 && listId) {
      void enrichWithPreview(rows.map(({ match: _m, ...r }) => r));
    }
  }, [listId]); // eslint-disable-line react-hooks/exhaustive-deps -- فقط با تغییر لیست

  useEffect(() => {
    if (!listId) return;
    const list = lists.find((l) => l.id === listId);
    if (list?.categoryId && list.categoryId !== categoryId) {
      setCategoryId(list.categoryId);
    }
  }, [listId, lists, categoryId]);

  useEffect(() => {
    if (!jsonText.trim()) {
      setRows([]);
      setSummary(null);
      setParseError('');
      return;
    }
    const { rows: parsed, parseError: pe } = parseBulkImportJson(jsonText, categorySlug);
    if (pe) {
      setParseError(pe);
      setRows([]);
      setSummary(null);
      return;
    }
    setParseError('');
    setSummary(null);
    setRows(parsed);
  }, [categorySlug]); // eslint-disable-line react-hooks/exhaustive-deps -- اعتبارسنجی محلی سریع

  const loadJsonFromFile = useCallback(
    (file: File) => {
      const isJson =
        file.name.toLowerCase().endsWith('.json') ||
        file.type === 'application/json' ||
        file.type === 'text/json';
      if (!isJson) {
        setParseError('فقط فایل .json پشتیبانی می‌شود');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setParseError('حداکثر حجم فایل ۲ مگابایت است');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? '');
        setJsonText(text);
        setLoadedFileName(file.name);
        void applyParsedJson(text);
      };
      reader.onerror = () => setParseError('خطا در خواندن فایل');
      reader.readAsText(file, 'UTF-8');
    },
    [applyParsedJson]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) loadJsonFromFile(file);
    },
    [loadJsonFromFile]
  );

  const updateRow = (id: string, patch: Partial<BulkImportRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch, valid: true, errors: [] } : r))
    );
  };

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const toggleAll = (on: boolean) => {
    setRows((prev) => prev.map((r) => (r.valid ? { ...r, selected: on } : r)));
  };

  const handleImport = () => {
    if (!listId) {
      setError('لیست مقصد را انتخاب کنید');
      return;
    }
    const payload = rows.filter((r) => r.selected && r.valid);
    if (payload.length === 0) {
      setError('حداقل یک ردیف معتبر انتخاب کنید');
      return;
    }
    setError('');
    setConfirmOpen(true);
  };

  const executeImport = async () => {
    if (!listId) return;
    const payload = rows.filter((r) => r.selected && r.valid);
    if (payload.length === 0) return;

    setImporting(true);
    setError('');
    setImportDone(null);

    const batches = chunk(payload, IMPORT_BATCH_SIZE);
    let importedTotal = 0;
    let createdTotal = 0;
    let linkedTotal = 0;
    let updatedTotal = 0;
    const allResults: { index: number; title: string; status: string; message?: string }[] = [];

    try {
      setImportProgress({
        done: 0,
        total: payload.length,
        batch: 0,
        batchCount: batches.length,
      });

      for (let b = 0; b < batches.length; b++) {
        const batch = batches[b];
        const offset = b * IMPORT_BATCH_SIZE;

        setImportProgress({
          done: offset,
          total: payload.length,
          batch: b + 1,
          batchCount: batches.length,
        });

        const res = await fetch('/api/admin/items/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listId,
            items: batch.map(rowToPayload),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا در import');

        importedTotal += data.imported ?? 0;
        createdTotal += data.created ?? 0;
        linkedTotal += data.linked ?? 0;
        updatedTotal += data.updated ?? 0;
        for (const r of data.results ?? []) {
          allResults.push({ ...r, index: offset + r.index });
        }

        setImportProgress({
          done: Math.min(offset + batch.length, payload.length),
          total: payload.length,
          batch: b + 1,
          batchCount: batches.length,
        });
      }

      setImportDone({
        imported: importedTotal,
        created: createdTotal,
        linked: linkedTotal,
        updated: updatedTotal,
        results: allResults,
      });
      setConfirmOpen(false);
      void enrichWithPreview(rows.map(({ match: _m, ...r }) => r));
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا');
      if (importedTotal > 0) {
        setImportDone({
          imported: importedTotal,
          created: createdTotal,
          linked: linkedTotal,
          updated: updatedTotal,
          results: allResults,
        });
      }
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  };

  const progressPercent =
    importProgress && importProgress.total > 0
      ? Math.round((importProgress.done / importProgress.total) * 100)
      : 0;

  return (
    <div className={`pb-12 ${embedded ? '' : 'max-w-5xl'}`} dir="rtl">
      {!embedded && (
        <>
          <Link
            href="/admin/lists"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-700 mb-4"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به لیست‌ها
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileJson className="w-7 h-7 text-violet-600" />
                import گروهی آیتم
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                هر دسته JSON اختصاصی · یک موجودیت کاتالوگ · چند لیست
              </p>
            </div>
          </div>
        </>
      )}

      <div className="mb-5 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/90 px-4 py-3 text-sm text-blue-900">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          هر آیتم <strong>یک رکورد در کاتالوگ</strong> دارد (با شناسهٔ یکتا مثل imdbId یا isbn).
          اگر در چند لیست تکرار شود، همان داده به‌روز می‌شود و فقط <strong>جایگاه</strong> جدید
          اضافه می‌شود.
        </p>
      </div>

      {/* انتخاب مقصد */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 mb-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-800">۱. مقصد import</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">دسته</label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setListId('');
                setJsonText('');
                setRows([]);
                setSummary(null);
                setParseError('');
              }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            >
              {categories.length === 0 ? (
                <option value="">دسته‌ای یافت نشد</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                    {!c.isActive ? ' (غیرفعال)' : ''} —{' '}
                    {(listCountByCategory.get(c.id) ?? 0).toLocaleString('fa-IR')} لیست
                  </option>
                ))
              )}
            </select>
            {selectedCategory && (
              <p className="text-[10px] text-gray-500 mt-1">
                فرمت: {getBulkImportFormatTitle(categorySlug, listContext)} ·{' '}
                {getBulkImportJsonHint(categorySlug, listContext)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">لیست</label>
            <select
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              disabled={!categoryId || filteredLists.length === 0}
            >
              <option value="">
                {!categoryId
                  ? 'ابتدا دسته را انتخاب کنید…'
                  : filteredLists.length === 0
                    ? 'لیستی در این دسته نیست'
                    : 'انتخاب لیست…'}
              </option>
              {filteredLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} ({l.itemCount.toLocaleString('fa-IR')} آیتم)
                </option>
              ))}
            </select>
            {categoryId && filteredLists.length === 0 && (
              <p className="text-[10px] text-amber-700 mt-1">
                ابتدا از{' '}
                <Link href="/admin/lists/new" className="underline font-medium">
                  لیست جدید
                </Link>{' '}
                برای این دسته بسازید.
              </p>
            )}
          </div>
        </div>
        {selectedList && (
          <p className="text-xs text-violet-700 bg-violet-50 rounded-lg px-3 py-2">
            مقصد: <strong>{selectedList.title}</strong> — آیتم‌های جدید بعد از{' '}
            {selectedList.itemCount.toLocaleString('fa-IR')} آیتم فعلی اضافه می‌شوند.
          </p>
        )}
      </section>

      {/* JSON */}
      <section className="rounded-2xl border border-gray-200 bg-white mb-5 overflow-hidden">
        <button
          type="button"
          onClick={() => setJsonCollapsed((c) => !c)}
          className="w-full flex items-center justify-between gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100 text-right"
        >
          <h2 className="text-sm font-bold text-gray-800">
            ۲. JSON از AI
            {selectedCategory && (
              <span className="text-xs font-normal text-gray-500 mr-2">
                ({getBulkImportFormatTitle(categorySlug, listContext)})
              </span>
            )}
          </h2>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            {jsonCollapsed ? 'باز کردن' : 'جمع کردن'}
            {jsonCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </span>
        </button>
        {!jsonCollapsed && (
        <div className="p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-gray-500">
            {selectedList
              ? `JSON برای لیست «${selectedList.title}» · دسته ${selectedCategory?.name ?? '—'}`
              : selectedCategory
                ? `ابتدا لیست مقصد را انتخاب کنید — فرمت ${getBulkImportCategoryLabel(categoryKind)}`
                : 'دسته و لیست را انتخاب کنید'}
          </p>
          <button
            type="button"
            onClick={() => setJsonText(getBulkImportJsonExample(categorySlug, listContext))}
            disabled={!categoryId}
            className="text-xs font-semibold text-violet-600 hover:underline disabled:opacity-50"
          >
            نمونه JSON ({getBulkImportCategoryLabel(categoryKind)}
            {selectedList ? ` · ${selectedList.title.slice(0, 24)}` : ''})
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadJsonFromFile(file);
            e.target.value = '';
          }}
        />

        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
          }}
          className={`rounded-xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-violet-500 bg-violet-50'
              : 'border-gray-200 bg-gray-50/80 hover:border-violet-300 hover:bg-violet-50/50'
          }`}
        >
          <FileUp className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-violet-600' : 'text-gray-400'}`} />
          <p className="text-sm font-semibold text-gray-700">
            فایل JSON را اینجا رها کنید
          </p>
          <p className="text-xs text-gray-500 mt-1">یا کلیک برای انتخاب فایل · حداکثر ۲MB</p>
          {loadedFileName && (
            <p className="text-xs text-violet-700 mt-2 font-medium">✓ {loadedFileName}</p>
          )}
        </div>

        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={10}
          dir="ltr"
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-mono bg-gray-50 focus:ring-2 focus:ring-violet-500/20"
          placeholder={`{ "items": [ { "title": "...", "description": "...", "imageUrl": "https://..." } ] }`}
        />
        {parseError && (
          <p className="text-sm text-red-600 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {parseError}
          </p>
        )}
        <button
          type="button"
          onClick={handleParse}
          disabled={!jsonText.trim() || previewLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold disabled:opacity-50"
        >
          {previewLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {previewLoading ? 'در حال تطبیق با کاتالوگ…' : 'تجزیه و پیش‌نمایش'}
        </button>
        <p className="text-[11px] text-gray-500">
          اعتبارسنجی JSON، تصویر و متادیتا فوری است · تطبیق کاتالوگ پس از انتخاب لیست
        </p>
        </div>
        )}
      </section>

      {/* پیش‌نمایش */}
      {rows.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden mb-5 shadow-sm">
          {summary && (
            <div
              className={`grid divide-x divide-x-reverse divide-gray-100 border-b border-gray-100 ${
                (summary.lightweight ?? 0) > 0 ? 'grid-cols-4' : 'grid-cols-3'
              }`}
            >
              <SummaryChip
                label="جدید"
                count={summary.new}
                active={matchFilter === 'new'}
                onClick={() => setMatchFilter(matchFilter === 'new' ? 'all' : 'new')}
                tone="emerald"
              />
              <SummaryChip
                label="در کاتالوگ"
                count={summary.existing_catalog}
                active={matchFilter === 'existing_catalog'}
                onClick={() =>
                  setMatchFilter(matchFilter === 'existing_catalog' ? 'all' : 'existing_catalog')
                }
                tone="amber"
              />
              <SummaryChip
                label="در این لیست"
                count={summary.already_in_list}
                active={matchFilter === 'already_in_list'}
                onClick={() =>
                  setMatchFilter(matchFilter === 'already_in_list' ? 'all' : 'already_in_list')
                }
                tone="violet"
              />
              {(summary.lightweight ?? 0) > 0 && (
                <SummaryChip
                  label="سبک"
                  count={summary.lightweight ?? 0}
                  active={matchFilter === 'lightweight'}
                  onClick={() =>
                    setMatchFilter(matchFilter === 'lightweight' ? 'all' : 'lightweight')
                  }
                  tone="emerald"
                />
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-bold text-gray-800">
              ۳. پیش‌نمایش ({displayRows.length.toLocaleString('fa-IR')} /{' '}
              {rows.length.toLocaleString('fa-IR')} · {selectedCount.toLocaleString('fa-IR')} انتخاب)
            </h2>
            <div className="flex gap-2 items-center">
              {listId && (
                <button
                  type="button"
                  disabled={previewLoading}
                  onClick={() => enrichWithPreview(rows.map(({ match: _m, ...r }) => r))}
                  className="text-xs text-gray-500 hover:text-violet-600 inline-flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${previewLoading ? 'animate-spin' : ''}`} />
                  تطبیق مجدد
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleAll(true)}
                className="text-xs font-semibold text-violet-600 hover:underline inline-flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                همه
              </button>
              <button
                type="button"
                onClick={() => toggleAll(false)}
                className="text-xs font-semibold text-gray-500 hover:underline inline-flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5" />
                هیچ‌کدام
              </button>
            </div>
          </div>

          <ul className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
            {displayRows.map((row, idx) => {
              const open = expandedId === row.id;
              return (
                <li
                  key={row.id}
                  className={`${!row.valid ? 'bg-red-50/50' : row.selected ? 'bg-violet-50/30' : ''}`}
                >
                  <div className="flex items-start gap-3 p-4">
                    <button
                      type="button"
                      disabled={!row.valid}
                      onClick={() => updateRow(row.id, { selected: !row.selected })}
                      className="mt-1 shrink-0 disabled:opacity-40"
                      aria-label={row.selected ? 'لغو انتخاب' : 'انتخاب'}
                    >
                      {row.selected && row.valid ? (
                        <CheckSquare className="w-5 h-5 text-violet-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 ring-1 ring-black/5">
                      <ImageWithFallback
                        src={row.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        fallbackIcon={bulkImportFallbackIcon(categoryKind)}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] text-gray-400 tabular-nums pt-1">#{idx + 1}</span>
                        <input
                          value={row.title}
                          onChange={(e) => updateRow(row.id, { title: e.target.value })}
                          className="flex-1 font-semibold text-sm border-0 border-b border-transparent hover:border-gray-200 focus:border-violet-400 bg-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="p-1 text-gray-400 hover:text-red-600 shrink-0"
                          title="حذف از پیش‌نمایش"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {row.match && <MatchBadge match={row.match} />}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {formatBulkImportRowSubtitle(row, categorySlug)}
                      </p>
                      {row.match?.sampleListTitles?.[0] && row.match.kind !== 'new' && (
                        <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                          <Link2 className="w-3 h-3 shrink-0" />
                          مثلاً: {row.match.sampleListTitles.join('، ')}
                        </p>
                      )}
                      {!row.valid && row.errors.length > 0 && (
                        <p className="text-xs text-red-600">{row.errors.join(' · ')}</p>
                      )}
                      {row.warnings?.length > 0 && (
                        <p className="text-xs text-amber-700">{row.warnings.join(' · ')}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : row.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0"
                    >
                      {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {open && (
                    <div className="px-4 pb-4 pr-14 space-y-3 border-t border-gray-50 pt-3">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500">توضیحات</label>
                        <textarea
                          rows={2}
                          value={row.description}
                          onChange={(e) => updateRow(row.id, { description: e.target.value })}
                          className="w-full mt-1 text-sm rounded-lg border border-gray-200 px-2 py-1.5"
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500">imageUrl</label>
                          <input
                            dir="ltr"
                            value={row.imageUrl}
                            onChange={(e) => updateRow(row.id, { imageUrl: e.target.value })}
                            className="w-full mt-1 text-xs rounded-lg border border-gray-200 px-2 py-1.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500">externalUrl</label>
                          <input
                            dir="ltr"
                            value={row.externalUrl}
                            onChange={(e) => updateRow(row.id, { externalUrl: e.target.value })}
                            className="w-full mt-1 text-xs rounded-lg border border-gray-200 px-2 py-1.5 font-mono"
                          />
                        </div>
                      </div>
                      <BulkImportMetadataEditor
                        kind={categoryKind}
                        row={row}
                        onUpdate={(metadata) => updateRow(row.id, { metadata, valid: true, errors: [] })}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {importing && importProgress && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-4 mb-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-semibold text-violet-900 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              در حال import…
            </p>
            <span className="text-xs text-violet-700 tabular-nums">
              {importProgress.done.toLocaleString('fa-IR')} /{' '}
              {importProgress.total.toLocaleString('fa-IR')} (
              {progressPercent.toLocaleString('fa-IR')}٪)
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-violet-200 overflow-hidden">
            <div
              className="h-full bg-violet-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-violet-600/90 mt-2">
            دسته {importProgress.batch.toLocaleString('fa-IR')} از{' '}
            {importProgress.batchCount.toLocaleString('fa-IR')} · آپلود تصاویر به‌صورت موازی (حداکثر ۵ همزمان)
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
      )}

      {importDone && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 mb-4 text-sm text-emerald-900">
          <p className="font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            import انجام شد
          </p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            {(importDone.created ?? 0) > 0 && (
              <span>🆕 {importDone.created!.toLocaleString('fa-IR')} جدید در کاتالوگ</span>
            )}
            {(importDone.linked ?? 0) > 0 && (
              <span>🔗 {importDone.linked!.toLocaleString('fa-IR')} لینک به لیست (کاتالوگ موجود)</span>
            )}
            {(importDone.updated ?? 0) > 0 && (
              <span>🔄 {importDone.updated!.toLocaleString('fa-IR')} به‌روزرسانی (قبلاً در لیست)</span>
            )}
            <span>➕ {importDone.imported.toLocaleString('fa-IR')} جایگاه جدید</span>
          </div>
          <ul className="mt-2 space-y-1 text-xs max-h-36 overflow-y-auto">
            {importDone.results.map((r) => (
              <li key={r.index} className={r.status === 'error' ? 'text-red-700' : ''}>
                #{r.index + 1} {r.title}: {r.message || r.status}
              </li>
            ))}
          </ul>
          {listId && (
            <Link
              href={`/admin/lists/${listId}`}
              className="inline-block mt-3 text-violet-700 font-semibold hover:underline"
            >
              مشاهده لیست →
            </Link>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <button
          type="button"
          onClick={handleImport}
          disabled={importing || !listId || selectedCount === 0}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-bold disabled:opacity-50"
        >
          {importing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              در حال import ({selectedCount.toLocaleString('fa-IR')} آیتم)…
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              import {selectedCount.toLocaleString('fa-IR')} آیتم انتخاب‌شده
            </>
          )}
        </button>
      )}

      <BulkImportConfirmDialog
        isOpen={confirmOpen}
        isLoading={importing}
        categoryName={selectedCategory?.name ?? '—'}
        categoryIcon={selectedCategory?.icon}
        listTitle={selectedList?.title ?? '—'}
        currentItemCount={selectedList?.itemCount ?? 0}
        importCount={selectedCount}
        onCancel={() => {
          if (!importing) setConfirmOpen(false);
        }}
        onConfirm={executeImport}
      />
    </div>
  );
}

function MatchBadge({ match }: { match: NonNullable<BulkImportRow['match']> }) {
  if (match.kind === 'lightweight') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
        <Sparkles className="w-3 h-3" />
        ورودی سبک · بدون کاتالوگ
      </span>
    );
  }
  if (match.kind === 'new') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
        <Sparkles className="w-3 h-3" />
        جدید در کاتالوگ
      </span>
    );
  }
  if (match.kind === 'already_in_list') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
        <RefreshCw className="w-3 h-3" />
        در این لیست · به‌روزرسانی داده
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
      <Link2 className="w-3 h-3" />
      کاتالوگ موجود · افزودن به لیست
      {match.listCount > 0 && ` (${match.listCount.toLocaleString('fa-IR')} لیست دیگر)`}
    </span>
  );
}

function SummaryChip({
  label,
  count,
  active,
  onClick,
  tone,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  tone: 'emerald' | 'amber' | 'violet';
}) {
  const tones = {
    emerald: active ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50',
    amber: active ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-50',
    violet: active ? 'bg-violet-600 text-white' : 'text-violet-700 hover:bg-violet-50',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 text-center text-xs font-semibold transition-colors ${tones[tone]}`}
    >
      {count.toLocaleString('fa-IR')} {label}
    </button>
  );
}
