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
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type { SerializedBookExtractJob } from '@/lib/admin/book-extract/serialize-job';
import type { WibeBookImportItem } from '@/lib/books/types';
import { BOOK_EXTRACT_IMPORT_KEY } from '@/lib/books/constants';

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
  const [targetListId, setTargetListId] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'ebook' | 'audiobook'>('all');
  const [autoImport, setAutoImport] = useState(false);
  const [enrichDetails, setEnrichDetails] = useState(true);
  const [fastMode, setFastMode] = useState(false);
  const [fuzzyMinScore, setFuzzyMinScore] = useState(70);
  const [jobs, setJobs] = useState<SerializedBookExtractJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [resuming, setResuming] = useState(false);

  const bookLists = useMemo(
    () =>
      lists.filter((l) => {
        const slug = l.categories?.slug?.toLowerCase() ?? '';
        return slug.includes('book') || slug.includes('literature');
      }),
    [lists]
  );

  const activeJob = jobs.find((j) => j.id === activeJobId) ?? jobs[0] ?? null;

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/books/extract');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'خطا در بارگذاری تاریخچه');
      }
      const data = await res.json();
      setJobs(data.data ?? []);
      if (!activeJobId && data.data?.[0]?.id) {
        const running = (data.data as SerializedBookExtractJob[]).find((j) =>
          ['PENDING', 'RUNNING'].includes(j.status)
        );
        if (running) setActiveJobId(running.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
    }
  }, [activeJobId]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const running = jobs.some((j) => j.status === 'PENDING' || j.status === 'RUNNING');
    if (!running) return;
    const timer = setInterval(() => void loadJobs(), 2000);
    return () => clearInterval(timer);
  }, [jobs, loadJobs]);

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

  const handleDelete = async (id: string) => {
    if (!confirm('این job حذف شود؟')) return;
    const res = await fetch(`/api/admin/books/extract/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'حذف ناموفق');
      return;
    }
    if (activeJobId === id) setActiveJobId(null);
    await loadJobs();
  };

  const resultItems = (activeJob?.resultItems as { items?: WibeBookImportItem[] } | null)?.items ?? [];

  const handleDownloadJson = () => {
    if (!activeJob?.resultItems) return;
    const blob = new Blob([JSON.stringify(activeJob.resultItems, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `book-extract-${activeJob.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGoToImport = () => {
    if (!activeJob?.resultItems) return;
    const listId = targetListId || activeJob.targetListId;
    sessionStorage.setItem(BOOK_EXTRACT_IMPORT_KEY, JSON.stringify(activeJob.resultItems));
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
    if (!resultItems.length) {
      setImportMessage('آیتمی برای import نیست');
      return;
    }
    setImporting(true);
    setImportMessage('');
    try {
      const res = await fetch('/api/admin/items/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId, items: resultItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'import ناموفق');
      setImportMessage(
        `import شد: ${data.imported ?? data.placementsAdded ?? resultItems.length} آیتم`
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
                    placeholder="https://fidibo.com/ebooks/story-persian-criminal"
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
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5" />
                تاریخچه
              </h2>
              <button
                type="button"
                onClick={() => void loadJobs()}
                className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                بروزرسانی
              </button>
            </div>

            <div className="overflow-x-auto">
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
                  {jobs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-400">
                        هنوز jobی ثبت نشده
                      </td>
                    </tr>
                  )}
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${
                        activeJob?.id === job.id ? 'bg-violet-50' : ''
                      }`}
                      onClick={() => setActiveJobId(job.id)}
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
                            void handleDelete(job.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {activeJob && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-gray-900">جزئیات job</h3>
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
                  {activeJob.status === 'COMPLETED' && (
                    <>
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
                <div className="rounded-xl bg-blue-50 text-blue-800 text-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {activeJob.progressMeta?.currentTitle
                    ? `در حال پردازش: ${activeJob.progressMeta.currentTitle}`
                    : 'در حال استخراج...'}
                  <span className="mr-auto">{activeJob.progress}%</span>
                </div>
              )}

              {activeJob.status === 'FAILED' && (
                <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">
                  {activeJob.errorMessage || 'خطای نامشخص'}
                </div>
              )}

              {activeJob.progressMeta && (
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <div className="text-gray-500">موفق</div>
                    <div className="text-lg font-semibold">{activeJob.itemCount}</div>
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

              {activeJob.progressMeta?.notFound?.length ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">پیدا نشد:</h4>
                  <p className="text-sm text-gray-500">{activeJob.progressMeta.notFound.join('، ')}</p>
                </div>
              ) : null}

              {resultItems.length > 0 && (
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="text-right text-gray-500 border-b">
                        <th className="py-2 pr-2">عنوان</th>
                        <th className="py-2">نویسنده</th>
                        <th className="py-2">نوع</th>
                        <th className="py-2">لینک</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultItems.map((item, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 pr-2 font-medium">{item.title}</td>
                          <td className="py-2 text-gray-600">{item.metadata?.author ?? '—'}</td>
                          <td className="py-2 text-gray-500 text-xs">
                            {item.metadata?.contentType
                              ? CONTENT_TYPE_LABELS[item.metadata.contentType]
                              : '—'}
                          </td>
                          <td className="py-2">
                            <a
                              href={item.externalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-violet-600 hover:underline text-xs"
                            >
                              منبع
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
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
