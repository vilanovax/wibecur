'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Loader2,
  Play,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  Copy,
  Check,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import BookExtractPreviewEditor from '@/components/admin/books/BookExtractPreviewEditor';
import type { SerializedBookExtractJob } from '@/lib/admin/book-extract/serialize-job';
import type { WibeBookImportItem } from '@/lib/books/types';
import { BOOK_EXTRACT_IMPORT_KEY } from '@/lib/books/constants';
import { BOOK_EXTRACT_JSON_EXAMPLE } from '@/lib/books/map-to-wibe';

type ListOption = {
  id: string;
  title: string;
  slug: string;
  categoryId: string | null;
  categories: { name: string; slug: string } | null;
};

const SOURCE_LABELS: Record<string, string> = {
  taaghche: 'طاقچه',
  fidibo: 'فیدیبو',
  ketabrah: 'کتابراه',
};

const MODE_LABELS: Record<string, string> = {
  titles: 'لیست عنوان',
  category: 'لینک دسته',
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  all: 'همه',
  ebook: 'الکترونیکی',
  audiobook: 'صوتی',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'در صف',
  RUNNING: 'در حال اجرا',
  COMPLETED: 'تکمیل',
  FAILED: 'ناموفق',
  CANCELLED: 'لغو شده',
};

const RECENT_JOBS_LIMIT = 5;

type ExtractMode = 'titles' | 'category';

type Props = {
  lists: ListOption[];
};

export default function BookExtractClient({ lists }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<ExtractMode>('titles');
  const [source, setSource] = useState<'taaghche' | 'fidibo' | 'ketabrah'>('fidibo');
  const [titlesText, setTitlesText] = useState('');
  const [categoryUrl, setCategoryUrl] = useState('');
  const [categoryLimit, setCategoryLimit] = useState(20);
  const [delayMs, setDelayMs] = useState(1200);
  const [targetListId, setTargetListId] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'ebook' | 'audiobook'>('ebook');
  const [autoImport, setAutoImport] = useState(false);
  const [enrichDetails, setEnrichDetails] = useState(true);
  const [fastMode, setFastMode] = useState(false);
  const [fuzzyMinScore, setFuzzyMinScore] = useState(70);
  const [recentJobs, setRecentJobs] = useState<SerializedBookExtractJob[]>([]);
  const [archivedJobs, setArchivedJobs] = useState<SerializedBookExtractJob[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveLoaded, setArchiveLoaded] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<SerializedBookExtractJob | null>(null);
  const [loadingJobDetail, setLoadingJobDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [resuming, setResuming] = useState(false);
  const [previewItems, setPreviewItems] = useState<WibeBookImportItem[]>([]);
  const [previewDirty, setPreviewDirty] = useState(false);
  const [syncedJobId, setSyncedJobId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [notFoundCopied, setNotFoundCopied] = useState(false);

  const bookLists = useMemo(
    () =>
      lists.filter((l) => {
        const slug = l.categories?.slug?.toLowerCase() ?? '';
        return slug.includes('book') || slug.includes('literature');
      }),
    [lists]
  );

  const archivedCount = Math.max(0, totalJobs - RECENT_JOBS_LIMIT);

  const loadRecentJobs = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/books/extract?limit=${RECENT_JOBS_LIMIT}&offset=0`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'خطا در بارگذاری تاریخچه');
      }
      const data = await res.json();
      const rows = (data.data ?? []) as SerializedBookExtractJob[];
      setRecentJobs(rows);
      setTotalJobs(data.total ?? rows.length);
      if (!activeJobId && rows[0]?.id) {
        const running = rows.find((j) => ['PENDING', 'RUNNING'].includes(j.status));
        if (running) setActiveJobId(running.id);
      }
      return rows;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
      return [];
    }
  }, [activeJobId]);

  const loadArchivedJobs = useCallback(async () => {
    if (totalJobs <= RECENT_JOBS_LIMIT) {
      setArchivedJobs([]);
      setArchiveLoaded(true);
      return;
    }
    setArchiveLoading(true);
    try {
      const res = await fetch(
        `/api/admin/books/extract?limit=50&offset=${RECENT_JOBS_LIMIT}&listOnly=1`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'خطا در بارگذاری آرشیو');
      }
      const data = await res.json();
      setArchivedJobs((data.data ?? []) as SerializedBookExtractJob[]);
      setArchiveLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setArchiveLoading(false);
    }
  }, [totalJobs]);

  const loadJobs = loadRecentJobs;

  const fetchJobDetail = useCallback(async (id: string) => {
    setLoadingJobDetail(true);
    try {
      const res = await fetch(`/api/admin/books/extract/${id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'خطا در دریافت job');
      }
      const data = await res.json();
      const job = data.data as SerializedBookExtractJob;
      setActiveJob(job);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
      return null;
    } finally {
      setLoadingJobDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadRecentJobs();
  }, [loadRecentJobs]);

  useEffect(() => {
    if (!activeJobId) {
      setActiveJob(null);
      return;
    }
    const inRecent = recentJobs.find((j) => j.id === activeJobId);
    if (inRecent) {
      setActiveJob(inRecent);
      return;
    }
    const inArchive = archivedJobs.find((j) => j.id === activeJobId);
    if (inArchive?.resultItems) {
      setActiveJob(inArchive);
      return;
    }
    void fetchJobDetail(activeJobId);
  }, [activeJobId, recentJobs, archivedJobs, fetchJobDetail]);

  useEffect(() => {
    const running = recentJobs.some((j) => j.status === 'PENDING' || j.status === 'RUNNING');
    if (!running) return;
    const timer = setInterval(() => void loadRecentJobs(), 2000);
    return () => clearInterval(timer);
  }, [recentJobs, loadRecentJobs]);

  useEffect(() => {
    if (archiveOpen && !archiveLoaded && totalJobs > RECENT_JOBS_LIMIT) {
      void loadArchivedJobs();
    }
  }, [archiveOpen, archiveLoaded, totalJobs, loadArchivedJobs]);

  const jobResultItems = useMemo(
    () =>
      (activeJob?.resultItems as { items?: WibeBookImportItem[] } | null)?.items ?? [],
    [activeJob?.resultItems]
  );

  useEffect(() => {
    if (!activeJob) {
      setPreviewItems([]);
      setPreviewDirty(false);
      setSyncedJobId(null);
      return;
    }
    const items = jobResultItems;
    if (activeJob.id !== syncedJobId) {
      setPreviewItems(JSON.parse(JSON.stringify(items)) as WibeBookImportItem[]);
      setSyncedJobId(activeJob.id);
      setPreviewDirty(false);
      return;
    }
    if (!previewDirty) {
      setPreviewItems((prev) => {
        const next = JSON.parse(JSON.stringify(items)) as WibeBookImportItem[];
        if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
        return next;
      });
    }
  }, [activeJob, jobResultItems, previewDirty, syncedJobId]);

  useEffect(() => {
    setJsonCopied(false);
  }, [previewItems, activeJobId]);

  const importPayload = useMemo(() => ({ items: previewItems }), [previewItems]);

  const handleStart = async () => {
    setError('');
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        mode,
        source,
        targetListId: targetListId || undefined,
        contentTypeFilter,
        autoImport: autoImport && !!targetListId,
        enrichDetails,
        fastMode,
        fuzzyMinScore,
        delayMs,
        limit: categoryLimit,
      };
      if (mode === 'titles') body.titlesText = titlesText;
      else body.categoryUrl = categoryUrl;

      const res = await fetch('/api/admin/books/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در شروع استخراج');
      setActiveJobId(data.data.id);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async (id: string) => {
    setResuming(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/books/extract/${id}/resume`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ادامه ناموفق');
      setActiveJobId(id);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setResuming(false);
    }
  };

  const canStart =
    mode === 'titles' ? titlesText.trim().length > 0 : categoryUrl.trim().length > 0;

  const handleDelete = async (id: string, fromArchive = false) => {
    if (!confirm(fromArchive ? 'این job از آرشیو حذف شود؟' : 'این job حذف شود؟')) return;
    const res = await fetch(`/api/admin/books/extract/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'حذف ناموفق');
      return;
    }
    if (activeJobId === id) {
      setActiveJobId(null);
      setActiveJob(null);
    }
    await loadRecentJobs();
    if (fromArchive) {
      setArchivedJobs((prev) => prev.filter((j) => j.id !== id));
      setTotalJobs((t) => Math.max(0, t - 1));
    } else if (archiveLoaded) {
      setArchiveLoaded(false);
      void loadArchivedJobs();
    }
  };

  const handleResetPreview = () => {
    setPreviewItems(JSON.parse(JSON.stringify(jobResultItems)) as WibeBookImportItem[]);
    setPreviewDirty(false);
  };

  const handleDownloadJson = () => {
    if (!previewItems.length) return;
    const blob = new Blob([JSON.stringify(importPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `book-extract-${activeJob?.id ?? 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = async () => {
    if (!previewItems.length) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(importPayload, null, 2));
      setJsonCopied(true);
      window.setTimeout(() => setJsonCopied(false), 2000);
    } catch {
      alert('کپی به کلیپ‌بورد ناموفق بود');
    }
  };

  const handleGoToImport = () => {
    if (!previewItems.length) return;
    const listId = targetListId || activeJob?.targetListId;
    sessionStorage.setItem(BOOK_EXTRACT_IMPORT_KEY, JSON.stringify(importPayload));
    const params = new URLSearchParams({ view: 'import' });
    if (listId) params.set('listId', listId);
    router.push(`/admin/lists?${params.toString()}`);
  };

  const handleDirectImport = async () => {
    const listId = targetListId || activeJob?.targetListId;
    if (!listId) {
      setImportMessage('لیست مقصد را انتخاب کنید');
      return;
    }
    if (!previewItems.length) {
      setImportMessage('آیتمی برای import نیست');
      return;
    }
    setImporting(true);
    setImportMessage('');
    try {
      const res = await fetch('/api/admin/items/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId, items: previewItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'import ناموفق');
      setImportMessage(
        `import شد: ${data.imported ?? data.placementsAdded ?? previewItems.length} آیتم`
      );
    } catch (err) {
      setImportMessage(err instanceof Error ? err.message : 'خطا در import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-violet-600" />
            استخراج داده کتاب
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            استخراج از طاقچه، فیدیبو یا کتابراه — لیست عنوان یا لینک دسته
          </p>
        </div>
        <Link
          href="/admin/lists?view=import"
          className="text-sm text-violet-600 hover:underline"
        >
          import گروهی دستی →
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">استخراج جدید</h2>

            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              {(['titles', 'category'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    mode === m ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">منبع</label>
              <div className="flex gap-2 flex-wrap">
                {(['fidibo', 'taaghche', 'ketabrah'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSource(s)}
                    className={`flex-1 min-w-[80px] rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      source === s
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {SOURCE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'titles' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عناوین کتاب (هر خط یک عنوان)
                </label>
                <textarea
                  value={titlesText}
                  onChange={(e) => setTitlesText(e.target.value)}
                  rows={8}
                  placeholder={'کیمیاگر\nاثر مرکب\nملت عشق'}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">لینک دسته</label>
                  <input
                    type="url"
                    value={categoryUrl}
                    onChange={(e) => setCategoryUrl(e.target.value)}
                    placeholder="https://fidibo.com/ebooks/story-persian-criminal یا contents/list?lists=[...]"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تعداد کتاب
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={categoryLimit}
                    onChange={(e) => setCategoryLimit(Number(e.target.value) || 20)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">لیست مقصد (اختیاری)</label>
              <select
                value={targetListId}
                onChange={(e) => setTargetListId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">— بعداً انتخاب —</option>
                {bookLists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                    {l.categories?.name ? ` (${l.categories.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع محتوا</label>
              <select
                value={contentTypeFilter}
                onChange={(e) =>
                  setContentTypeFilter(e.target.value as 'all' | 'ebook' | 'audiobook')
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
                {(['all', 'ebook', 'audiobook'] as const).map((value) => (
                  <option key={value} value={value}>
                    {CONTENT_TYPE_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoImport}
                  onChange={(e) => setAutoImport(e.target.checked)}
                  disabled={!targetListId}
                />
                import خودکار پس از استخراج
                {!targetListId && (
                  <span className="text-xs text-gray-400">(لیست مقصد لازم است)</span>
                )}
              </label>
            </div>

            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enrichDetails}
                  onChange={(e) => setEnrichDetails(e.target.checked)}
                />
                جزئیات کامل (صفحه کتاب)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={fastMode}
                  onChange={(e) => setFastMode(e.target.checked)}
                />
                fast mode (فقط نتایج جستجو)
              </label>
              {fastMode && (
                <details className="rounded-xl border border-violet-100 bg-violet-50/50 p-3 text-xs text-gray-600">
                  <summary className="cursor-pointer font-medium text-violet-800">
                    فرمت خروجی JSON (مطابق import گروهی)
                  </summary>
                  <p className="mt-2 mb-2 leading-relaxed">
                    در fast mode: عنوان، کاور و لینک از جستجو + نویسنده در metadata. اگر لیست
                    مقصد انتخاب شود، پیشوند «برای لیست …» به description اضافه می‌شود. برای کتاب
                    صوتی، راوی در tip قرار می‌گیرد.
                  </p>
                  <pre
                    dir="ltr"
                    className="overflow-x-auto rounded-lg bg-white border border-violet-100 p-2 text-[10px] leading-relaxed text-left font-mono"
                  >
                    {BOOK_EXTRACT_JSON_EXAMPLE}
                  </pre>
                </details>
              )}
              <label className="flex items-center gap-2 justify-between">
                <span>فاصله بین درخواست‌ها (میلی‌ثانیه)</span>
                <input
                  type="number"
                  min={0}
                  max={10000}
                  step={100}
                  value={delayMs}
                  onChange={(e) => setDelayMs(Math.max(0, Number(e.target.value) || 0))}
                  className="w-20 rounded border border-gray-200 px-2 py-1 text-center"
                  dir="ltr"
                />
              </label>
              <p className="text-xs text-gray-400 pr-6">
                بین هر صفحه لیست و هر جزئیات کتاب؛ برای جلوگیری از بلاک فیدیبو ۱۲۰۰+ پیشنهاد می‌شود.
              </p>
              <label className="flex items-center gap-2 justify-between">
                <span>حداقل امتیاز fuzzy (فقط لیست عنوان)</span>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={fuzzyMinScore}
                  onChange={(e) => setFuzzyMinScore(Number(e.target.value) || 70)}
                  className="w-16 rounded border border-gray-200 px-2 py-1 text-center"
                  disabled={mode === 'category'}
                />
              </label>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 text-red-700 text-sm px-3 py-2 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleStart()}
              disabled={loading || !canStart}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 text-white py-2.5 font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              شروع استخراج
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-2 p-5 pb-0">
              <button
                type="button"
                onClick={() => setHistoryOpen((v) => !v)}
                className="flex min-w-0 flex-1 items-center gap-2 text-right font-semibold text-gray-900 hover:text-violet-700 transition-colors"
                aria-expanded={historyOpen}
              >
                {historyOpen ? (
                  <ChevronUp className="w-4 h-4 shrink-0 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />
                )}
                <History className="w-5 h-5 shrink-0" />
                <span>تاریخچه</span>
                {!historyOpen && totalJobs > 0 && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {totalJobs.toLocaleString('fa-IR')}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => void loadJobs()}
                className="shrink-0 text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                بروزرسانی
              </button>
            </div>

            {historyOpen && (
            <div className="p-5 pt-4 overflow-x-auto space-y-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right text-gray-500 border-b">
                    <th className="py-2 pr-2">وضعیت</th>
                    <th className="py-2">mode</th>
                    <th className="py-2">منبع</th>
                    <th className="py-2">تعداد</th>
                    <th className="py-2">پیشرفت</th>
                    <th className="py-2">تاریخ</th>
                    <th className="py-2 pl-2" />
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-400">
                        هنوز jobی ثبت نشده
                      </td>
                    </tr>
                  )}
                  {recentJobs.map((job) => (
                    <JobHistoryRow
                      key={job.id}
                      job={job}
                      selected={activeJob?.id === job.id}
                      onSelect={() => setActiveJobId(job.id)}
                      onDelete={() => void handleDelete(job.id)}
                    />
                  ))}
                </tbody>
              </table>

              {archivedCount > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setArchiveOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    aria-expanded={archiveOpen}
                  >
                    <span>
                      آرشیو ({archivedCount.toLocaleString('fa-IR')} مورد قدیمی‌تر)
                    </span>
                    {archiveOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {archiveOpen && (
                    <div className="mt-2">
                      {archiveLoading ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          در حال بارگذاری آرشیو...
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <tbody>
                            {archivedJobs.length === 0 && (
                              <tr>
                                <td colSpan={7} className="py-4 text-center text-gray-400">
                                  موردی در آرشیو نیست
                                </td>
                              </tr>
                            )}
                            {archivedJobs.map((job) => (
                              <JobHistoryRow
                                key={job.id}
                                job={job}
                                selected={activeJob?.id === job.id}
                                onSelect={() => setActiveJobId(job.id)}
                                onDelete={() => void handleDelete(job.id, true)}
                                muted
                              />
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
          </div>

          {activeJob && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  جزئیات job
                  {loadingJobDetail && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeJob.status === 'FAILED' &&
                    activeJob.mode === 'titles' &&
                    (activeJob.progressMeta?.processedTitles?.length ?? 0) <
                      (activeJob.progressMeta?.total ?? 0) && (
                      <button
                        type="button"
                        onClick={() => void handleResume(activeJob.id)}
                        disabled={resuming}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 text-amber-800 px-3 py-1.5 text-sm hover:bg-amber-50 disabled:opacity-50"
                      >
                        {resuming ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        ادامه
                      </button>
                    )}
                  {activeJob.status === 'COMPLETED' && previewItems.length > 0 && (
                    <>
                      {previewDirty && (
                        <button
                          type="button"
                          onClick={handleResetPreview}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                        >
                          <RotateCcw className="w-4 h-4" />
                          بازنشانی
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleCopyJson()}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
                      >
                        {jsonCopied ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {jsonCopied ? 'کپی شد' : 'کپی JSON'}
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadJson}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4" />
                        JSON
                      </button>
                      <button
                        type="button"
                        onClick={handleGoToImport}
                        className="inline-flex items-center gap-1 rounded-lg border border-violet-200 text-violet-700 px-3 py-1.5 text-sm hover:bg-violet-50"
                      >
                        <Upload className="w-4 h-4" />
                        ویرایش در import
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDirectImport()}
                        disabled={importing}
                        className="inline-flex items-center gap-1 rounded-lg bg-violet-600 text-white px-3 py-1.5 text-sm hover:bg-violet-700 disabled:opacity-50"
                      >
                        {importing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        import مستقیم
                      </button>
                    </>
                  )}
                </div>
              </div>

              {(activeJob.status === 'PENDING' || activeJob.status === 'RUNNING') && (
                <div className="space-y-2">
                  <div className="rounded-xl bg-blue-50 text-blue-800 text-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <div className="min-w-0 flex-1">
                        {activeJob.progressMeta?.currentTitle ? (
                          <div className="font-medium truncate">
                            {activeJob.progressMeta.currentTitle}
                          </div>
                        ) : (
                          <div>در حال استخراج...</div>
                        )}
                        {activeJob.progressMeta?.currentStep && (
                          <div className="text-xs text-blue-600/90 mt-0.5">
                            {activeJob.progressMeta.currentStep}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium shrink-0">
                        {activeJob.progressMeta?.done ?? 0} / {activeJob.progressMeta?.total ?? '—'}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-blue-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${Math.max(activeJob.progress, 2)}%` }}
                      />
                    </div>
                    <div className="text-xs text-blue-600/80 mt-1 text-left" dir="ltr">
                      {activeJob.progress}%
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 px-1">
                    اگر بیش از ۱ دقیقه ماند، احتمالاً سایت منبع از سرور در دسترس نیست — fast mode را
                    امتحان کنید یا منبع دیگر انتخاب کنید.
                  </p>
                </div>
              )}

              {activeJob.status === 'COMPLETED' && activeJob.progressMeta?.summary && (
                <div
                  className={`rounded-xl text-sm px-4 py-3 ${
                    activeJob.itemCount > 0
                      ? 'bg-green-50 text-green-800'
                      : (activeJob.progressMeta.errors?.length ?? 0) > 0
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {activeJob.progressMeta.summary}
                </div>
              )}

              {activeJob.status === 'FAILED' && (
                <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">
                  {activeJob.errorMessage || 'خطای نامشخص'}
                </div>
              )}

              {activeJob.progressMeta && (
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <div className="text-gray-500">موفق</div>
                    <div className="text-lg font-semibold">{activeJob.itemCount}</div>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <div className="text-emerald-700">از دیتابیس</div>
                    <div className="text-lg font-semibold">
                      {activeJob.progressMeta.fromDatabase?.length ?? 0}
                    </div>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3">
                    <div className="text-amber-700">پیدا نشد</div>
                    <div className="text-lg font-semibold">
                      {activeJob.progressMeta.notFound?.length ?? 0}
                    </div>
                  </div>
                  <div className="rounded-xl bg-red-50 p-3">
                    <div className="text-red-700">خطا</div>
                    <div className="text-lg font-semibold">
                      {activeJob.progressMeta.errors?.length ?? 0}
                    </div>
                  </div>
                </div>
              )}

              {importMessage && (
                <div className="text-sm text-violet-700 bg-violet-50 rounded-xl px-3 py-2">
                  {importMessage}
                </div>
              )}

              {activeJob.progressMeta?.importResult && (
                <div className="text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2">
                  import خودکار: {activeJob.progressMeta.importResult.message}
                  {activeJob.progressMeta.importResult.errors > 0 && (
                    <span className="text-amber-700">
                      {' '}
                      ({activeJob.progressMeta.importResult.errors} خطا)
                    </span>
                  )}
                </div>
              )}

              {activeJob.progressMeta?.fromDatabase?.length ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">از دیتابیس (بدون استخراج):</h4>
                  <p className="text-sm text-gray-500">
                    {activeJob.progressMeta.fromDatabase.join('، ')}
                  </p>
                </div>
              ) : null}

              {activeJob.progressMeta?.notFound?.length ? (
                <NotFoundTitlesPanel
                  titles={activeJob.progressMeta.notFound}
                  jobId={activeJob.id}
                  copied={notFoundCopied}
                  onCopied={() => {
                    setNotFoundCopied(true);
                    window.setTimeout(() => setNotFoundCopied(false), 2000);
                  }}
                />
              ) : null}

              {(activeJob.progressMeta?.errors?.length ?? 0) > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 space-y-2">
                  <h4 className="text-sm font-medium text-red-800 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    جزئیات خطاها
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {activeJob.progressMeta!.errors!.map((err, i) => (
                      <li key={i} className="rounded-lg bg-white border border-red-100 px-3 py-2">
                        <div className="font-medium text-gray-900">{err.title}</div>
                        <div className="text-red-700 text-xs mt-1 leading-relaxed">{err.message}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {previewItems.length > 0 && (
                <BookExtractPreviewEditor
                  items={previewItems}
                  onChange={(items) => {
                    setPreviewItems(items);
                    setPreviewDirty(true);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotFoundTitlesPanel({
  titles,
  jobId,
  copied,
  onCopied,
}: {
  titles: string[];
  jobId: string;
  copied: boolean;
  onCopied: () => void;
}) {
  const text = titles.join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      onCopied();
    } catch {
      alert('کپی به کلیپ‌بورد ناموفق بود');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `book-extract-not-found-${jobId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-medium text-amber-900">
            عناوین پیدا نشده ({titles.length})
          </h4>
          <p className="mt-0.5 text-xs text-amber-800/80">
            برای استخراج مجدد، لیست را کپی کنید یا دانلود بگیرید.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-50"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'کپی شد' : 'کپی لیست'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-50"
          >
            <Download className="h-3.5 w-3.5" />
            TXT
          </button>
        </div>
      </div>
      <ol className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-amber-100 bg-white px-3 py-2.5 text-sm text-gray-700">
        {titles.map((title, index) => (
          <li key={`${index}-${title}`} className="flex gap-2 leading-relaxed">
            <span className="shrink-0 tabular-nums text-xs text-amber-700/70">{index + 1}.</span>
            <span className="min-w-0 flex-1">{title}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function JobHistoryRow({
  job,
  selected,
  onSelect,
  onDelete,
  muted = false,
}: {
  job: SerializedBookExtractJob;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  muted?: boolean;
}) {
  return (
    <tr
      className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${
        selected ? 'bg-violet-50' : muted ? 'text-gray-600' : ''
      }`}
      onClick={onSelect}
    >
      <td className="py-2 pr-2">
        <StatusBadge status={job.status} />
      </td>
      <td className="py-2">{MODE_LABELS[job.mode] ?? job.mode}</td>
      <td className="py-2">{SOURCE_LABELS[job.source] ?? job.source}</td>
      <td className="py-2">{job.itemCount}</td>
      <td className="py-2">{job.progress}%</td>
      <td className="py-2 text-gray-500 text-xs">
        {new Date(job.createdAt).toLocaleString('fa-IR')}
      </td>
      <td className="py-2 pl-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-gray-400 hover:text-red-600"
          title="حذف"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const className =
    status === 'COMPLETED'
      ? 'bg-green-100 text-green-700'
      : status === 'FAILED'
        ? 'bg-red-100 text-red-700'
        : status === 'RUNNING'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'FAILED' && <XCircle className="w-3 h-3" />}
      {status === 'RUNNING' && <Loader2 className="w-3 h-3 animate-spin" />}
      {label}
    </span>
  );
}
