'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  Download,
  Eye,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  RefreshCw,
  Shield,
  Info,
  Archive,
  Trash2,
  Link2,
  FileJson,
  X,
  Sparkles,
  Tag,
  List,
  Package,
  MessageCircle,
  Users,
  ShieldAlert,
  Lightbulb,
  Settings,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { AdminCard, Badge } from '@/components/admin/design-system';
import BackupContentCore from '@/components/admin/backup/BackupContentCore';
import BackupImportPanel from '@/components/admin/backup/BackupImportPanel';
import type { BackupImportPreview } from '@/lib/admin/backup/build-preview';
import type { BackupPreviewStats } from '@/lib/admin/backup/stats';
import {
  BACKUP_SCOPE_LABELS,
  CONTENT_SCOPES,
  SELECTABLE_BACKUP_SCOPES,
  normalizeBackupScopes,
  type BackupScope,
  type ContentScope,
} from '@/lib/admin/backup/types';

type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

interface BackupJobRow {
  id: string;
  status: JobStatus;
  scopes: unknown;
  assetMode: string;
  includeTrash: boolean;
  fileName: string | null;
  fileSizeBytes: number | null;
  progress: number;
  errorMessage: string | null;
  stats: Record<string, number> | null;
  createdAt: string;
  completedAt: string | null;
  createdBy: { id: string; name: string | null; email: string | null };
}

const SELECTABLE_SCOPES = SELECTABLE_BACKUP_SCOPES;
const OTHER_SCOPES = SELECTABLE_SCOPES.filter(
  (s) => !(CONTENT_SCOPES as readonly string[]).includes(s)
);

const SCOPE_META: Record<
  BackupScope,
  { short: string; icon: LucideIcon; hint?: string }
> = {
  content: { short: 'محتوا', icon: Package, hint: 'دسته، لیست، آیتم' },
  categories: { short: 'دسته‌ها', icon: Tag },
  lists: { short: 'لیست‌ها', icon: List },
  items: { short: 'آیتم‌ها', icon: Package },
  engagement: { short: 'تعامل', icon: MessageCircle, hint: 'ذخیره، کامنت، رأی' },
  users: { short: 'کاربران', icon: Users, hint: 'بدون رمز عبور' },
  moderation: { short: 'نظارت', icon: ShieldAlert, hint: 'ریپورت، کلمات ممنوع' },
  suggestions: { short: 'پیشنهادها', icon: Lightbulb },
  settings: { short: 'تنظیمات', icon: Settings, hint: 'بدون API key' },
  featured: { short: 'منتخب هوم', icon: Star },
  full: { short: 'همه', icon: Database },
};

const SCOPE_GROUPS: { title: string; scopes: BackupScope[] }[] = [
  { title: 'نمایش', scopes: ['featured'] },
  { title: 'کاربران و تعامل', scopes: ['users', 'engagement'] },
  { title: 'نظارت و پیشنهاد', scopes: ['moderation', 'suggestions'] },
  { title: 'سیستم', scopes: ['settings'] },
];

const PRESETS: { id: string; label: string; scopes: BackupScope[]; recommended?: boolean; hint?: string }[] = [
  {
    id: 'full',
    label: 'پشتیبان کامل',
    scopes: [...SELECTABLE_SCOPES],
    recommended: true,
    hint: 'همه بخش‌ها — برای migration یا بازیابی کامل',
  },
  {
    id: 'content',
    label: 'هسته محتوا',
    scopes: ['categories', 'lists', 'items'],
    hint: 'دسته، لیست و آیتم',
  },
  {
    id: 'content-settings',
    label: 'محتوا + تنظیمات',
    scopes: ['categories', 'lists', 'items', 'settings'],
    hint: 'محتوا + config سایت',
  },
  {
    id: 'users-engagement',
    label: 'کاربران + تعامل',
    scopes: ['users', 'engagement'],
    hint: 'کاربر، ذخیره، کامنت، فالو',
  },
];

const STATUS_LABEL: Record<JobStatus, string> = {
  PENDING: 'در صف',
  RUNNING: 'در حال اجرا',
  COMPLETED: 'آماده',
  FAILED: 'خطا',
};

function formatBytes(n: number | null): string {
  if (n == null || n <= 0) return '—';
  if (n < 1024) return `${n} ب`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function parseScopeList(scopes: unknown): BackupScope[] {
  if (!Array.isArray(scopes)) return [];
  return normalizeBackupScopes(scopes.filter((s) => typeof s === 'string') as string[]);
}

type BackupTab = 'export' | 'import';

export default function BackupPageClient() {
  const [activeTab, setActiveTab] = useState<BackupTab>('export');
  const [importPreview, setImportPreview] = useState<BackupImportPreview | null>(null);
  const [previewJobLoading, setPreviewJobLoading] = useState(false);
  const [jobs, setJobs] = useState<BackupJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<BackupScope[]>([
    'categories',
    'lists',
    'items',
    'settings',
  ]);
  const [stats, setStats] = useState<BackupPreviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [assetMode, setAssetMode] = useState<'none' | 'urls_only'>('urls_only');
  const [includeTrash, setIncludeTrash] = useState(false);

  const contentSelected = useMemo(
    () => CONTENT_SCOPES.filter((c) => selectedScopes.includes(c)),
    [selectedScopes]
  );

  const fetchJobs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/admin/backup');
      const json = await res.json();
      if (res.ok) {
        setJobs(json.data ?? []);
        setError(null);
      } else if (!silent) {
        setError(json.error ?? 'خطا در بارگذاری تاریخچه');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchStats = useCallback(async (signal?: AbortSignal) => {
    setStatsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('includeTrash', String(includeTrash));
      if (selectedScopes.length) params.set('scopes', selectedScopes.join(','));
      const res = await fetch(`/api/admin/backup/stats?${params}`, { signal });
      const json = await res.json();
      if (res.ok) {
        setStats(json.data ?? null);
      } else if (process.env.NODE_ENV === 'development' && json.detail) {
        console.warn('[backup stats]', json.detail);
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return; // پاسخ قدیمی لغو شد — نادیده بگیر
    } finally {
      if (!signal?.aborted) setStatsLoading(false);
    }
  }, [includeTrash, selectedScopes]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const ctrl = new AbortController();
    void fetchStats(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchStats]);

  const activeJob = useMemo(
    () => jobs.find((j) => j.status === 'PENDING' || j.status === 'RUNNING'),
    [jobs]
  );
  const hasActive = Boolean(activeJob);

  useEffect(() => {
    if (!hasActive) return;
    const t = setInterval(() => void fetchJobs(true), 3000);
    return () => clearInterval(t);
  }, [hasActive, fetchJobs]);

  const toggleScope = (scope: BackupScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const toggleContentScope = (scope: ContentScope) => toggleScope(scope);

  const selectAllContent = () => {
    setSelectedScopes((prev) => {
      const rest = prev.filter((s) => !(CONTENT_SCOPES as readonly string[]).includes(s));
      return [...rest, ...CONTENT_SCOPES];
    });
  };

  const applyPreset = (scopes: BackupScope[]) => setSelectedScopes([...scopes]);
  const clearScopes = () => setSelectedScopes([]);

  const handleCreate = async () => {
    setError(null);
    if (selectedScopes.length === 0) {
      setError('حداقل یک بخش را انتخاب کنید');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopes: selectedScopes, assetMode, includeTrash }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'خطا در ایجاد پشتیبان');
        return;
      }
      await fetchJobs(true);
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = (id: string, fileName: string | null) => {
    const a = document.createElement('a');
    a.href = `/api/admin/backup/${id}/download`;
    a.download = fileName ?? 'wibecur-backup.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handlePreviewJob = async (jobId: string) => {
    setPreviewJobLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/backup/import/from-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? json.detail ?? 'خطا در پیش‌نمایش');
        return;
      }
      setImportPreview(json.data);
      setActiveTab('import');
    } finally {
      setPreviewJobLoading(false);
    }
  };

  const selectedCount = selectedScopes.length;
  const isFullSelection = selectedCount === SELECTABLE_SCOPES.length;
  const hasContentCore = contentSelected.length > 0;
  const hasFullContentCore = CONTENT_SCOPES.every((c) => selectedScopes.includes(c));
  const estimatedRows = stats?.estimatedRows ?? null;
  const lastCompletedJob = useMemo(
    () => jobs.find((j) => j.status === 'COMPLETED' && j.fileName),
    [jobs]
  );

  const contentWarnings = useMemo(() => {
    const warnings: string[] = [];
    const has = (s: ContentScope) => selectedScopes.includes(s);
    if (has('items') && !has('lists')) {
      warnings.push('آیتم‌ها بدون لیست‌ها — در بازیابی ممکن است آیتم‌های بدون والد import شوند.');
    }
    if (has('lists') && !has('categories')) {
      warnings.push('لیست‌ها بدون دسته‌بندی — slug دسته در export ناقص می‌ماند.');
    }
    if (hasContentCore && !hasFullContentCore) {
      warnings.push('برای پشتیبان کامل محتوا، هر سه بخش دسته / لیست / آیتم را انتخاب کنید.');
    }
    return warnings;
  }, [selectedScopes, hasContentCore, hasFullContentCore]);

  return (
    <div className="space-y-5">
      <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-800/80 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={clsx(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
            activeTab === 'export'
              ? 'bg-white dark:bg-gray-700 shadow-sm text-violet-800 dark:text-violet-100'
              : 'text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]'
          )}
        >
          <Database className="h-4 w-4" />
          خروجی (Export)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={clsx(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
            activeTab === 'import'
              ? 'bg-white dark:bg-gray-700 shadow-sm text-violet-800 dark:text-violet-100'
              : 'text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]'
          )}
        >
          <Upload className="h-4 w-4" />
          ورود و بازیابی
        </button>
      </div>

      {activeTab === 'import' ? (
        <BackupImportPanel
          injectPreview={importPreview}
          onInjectConsumed={() => setImportPreview(null)}
        />
      ) : (
        <>
      {hasActive && activeJob && (
        <ActiveJobBanner job={activeJob} />
      )}

      {stats && !statsLoading && (
        <DataOverviewStrip stats={stats} includeTrash={includeTrash} />
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-4 min-w-0">
          <AdminCard padding="compact" hover={false} className="!p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setInfoOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-right hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">
                <Info className="h-4 w-4 shrink-0 text-blue-500" />
                <span>فرمت خروجی و محدودیت‌های فاز ۱</span>
              </span>
              <span className="text-xs text-violet-600 dark:text-violet-400">
                {infoOpen ? 'بستن' : 'جزئیات'}
              </span>
            </button>
            {infoOpen && (
              <div className="px-4 pb-4 pt-0 text-xs leading-relaxed text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] border-t border-gray-100 dark:border-gray-700/80 space-y-2">
                <p>خروجی: JSON در ZIP (یا یک فایل JSON در صورت نبود archiver).</p>
                <p>
                  <Shield className="inline h-3.5 w-3.5 ml-1 text-emerald-600" />
                  رمز عبور و کلیدهای API حذف می‌شوند.
                </p>
                <p>
                  تصاویر باینری دانلود نمی‌شوند؛ در حالت «فهرست URL» فقط{' '}
                  <code className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 text-[10px]">
                    media-manifest.json
                  </code>{' '}
                  ساخته می‌شود.
                </p>
              </div>
            )}
          </AdminCard>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] ml-1">پیش‌تنظیم:</span>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.hint}
                onClick={() => applyPreset(p.scopes)}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                  arraysEqual(selectedScopes, p.scopes)
                    ? 'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-600 dark:bg-violet-900/30 dark:text-violet-200'
                    : 'border-gray-200 bg-white text-[var(--color-text)] hover:border-violet-200 dark:border-gray-600 dark:bg-gray-800 dark:text-[var(--color-text-subtle)]'
                )}
              >
                {p.recommended && (
                  <span className="rounded bg-violet-600 px-1 py-0.5 text-[9px] font-bold text-white leading-none">
                    توصیه
                  </span>
                )}
                {p.label}
              </button>
            ))}
          </div>

          {contentWarnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="flex items-start gap-2 text-xs font-medium text-amber-900 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>توجه به انتخاب محتوا</span>
              </p>
              <ul className="mt-2 space-y-1 pr-6 text-xs text-amber-800 dark:text-amber-300/90 list-disc">
                {contentWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <AdminCard padding="default" hover={false} className="space-y-5">
            <BackupContentCore
              selected={contentSelected}
              stats={stats}
              statsLoading={statsLoading}
              onToggle={toggleContentScope}
              onSelectAll={selectAllContent}
            />

            <div className="border-t border-gray-100 dark:border-gray-700/80 pt-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text)] dark:text-white">سایر بخش‌ها</h2>
                <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] mt-0.5">
                  {selectedCount} از {SELECTABLE_SCOPES.length} ·{' '}
                  {OTHER_SCOPES.filter((s) => selectedScopes.includes(s)).length} از{' '}
                  {OTHER_SCOPES.length} اختیاری
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset(SELECTABLE_SCOPES)}
                  className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                >
                  همه
                </button>
                <span className="text-[var(--color-text-subtle)] dark:text-[var(--color-text-muted)]">|</span>
                <button
                  type="button"
                  onClick={clearScopes}
                  disabled={selectedCount === 0}
                  className="text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
                >
                  پاک کردن
                </button>
              </div>
            </div>

            {SCOPE_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2">
                <h3 className="text-[11px] font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">
                  {group.title}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                  {group.scopes.map((scope) => (
                    <ScopeChip
                      key={scope}
                      scope={scope}
                      count={stats ? getScopeCount(stats, scope) : undefined}
                      selected={selectedScopes.includes(scope)}
                      onToggle={() => toggleScope(scope)}
                    />
                  ))}
                </div>
              </div>
            ))}
            </div>
          </AdminCard>

          <AdminCard padding="default" hover={false} className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--color-text)] dark:text-white">گزینه‌های پیشرفته</h2>

            <div className="space-y-2">
              <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">رسانه و تصاویر</span>
              <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-800/80 gap-1 w-full sm:w-auto">
                <SegmentOption
                  active={assetMode === 'none'}
                  onClick={() => setAssetMode('none')}
                  icon={FileJson}
                  label="فقط داده"
                  sub="بدون URL تصویر"
                />
                <SegmentOption
                  active={assetMode === 'urls_only'}
                  onClick={() => setAssetMode('urls_only')}
                  icon={Link2}
                  label="فهرست URL"
                  sub="media-manifest"
                />
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={includeTrash}
              onClick={() => setIncludeTrash((v) => !v)}
              className={clsx(
                'w-full flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-right transition-colors',
                includeTrash
                  ? 'border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50/80 dark:hover:bg-gray-800/40'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Trash2
                  className={clsx(
                    'h-4 w-4 shrink-0',
                    includeTrash ? 'text-amber-600' : 'text-[var(--color-text-subtle)]'
                  )}
                />
                <div>
                  <span className="text-sm font-medium text-[var(--color-text)] dark:text-gray-200 block">
                    شامل سطل‌زباله
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">
                    رکوردهای soft-delete
                  </span>
                </div>
              </div>
              <span
                className={clsx(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                  includeTrash ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-0.5 size-5 rounded-full bg-white shadow transition-[inset-inline-start]',
                    includeTrash ? 'start-[1.375rem]' : 'start-0.5'
                  )}
                />
              </span>
            </button>
          </AdminCard>
        </div>

        <aside className="lg:sticky lg:top-20 h-fit space-y-4">
          <AdminCard padding="default" hover={false} className="space-y-4 border-violet-200/60 dark:border-violet-500/20">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white">
                <Database className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-[var(--color-text)] dark:text-white">خلاصه خروجی</h2>
                <p className="text-[11px] text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">قبل از شروع بررسی کنید</p>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">
              {hasContentCore && stats && (
                <>
                  <SummaryRow
                    label="دسته‌ها"
                    value={contentSelected.includes('categories') ? fmt(stats.categories) : '—'}
                    highlight={contentSelected.includes('categories')}
                  />
                  <SummaryRow
                    label="لیست‌ها"
                    value={contentSelected.includes('lists') ? fmt(stats.lists) : '—'}
                    highlight={contentSelected.includes('lists')}
                  />
                  <SummaryRow
                    label="آیتم‌ها"
                    value={contentSelected.includes('items') ? fmt(stats.items) : '—'}
                    highlight={contentSelected.includes('items')}
                  />
                </>
              )}
              {stats &&
                OTHER_SCOPES.filter((s) => selectedScopes.includes(s)).map((scope) => (
                  <SummaryRow
                    key={scope}
                    label={SCOPE_META[scope].short}
                    value={fmt(getScopeCount(stats, scope) ?? 0)}
                  />
                ))}
              <li className="border-t border-gray-100 dark:border-gray-700/80 pt-2 mt-1" />
              <SummaryRow
                label="تخمین ردیف"
                value={
                  estimatedRows != null && selectedCount
                    ? estimatedRows.toLocaleString('fa-IR')
                    : '—'
                }
                highlight={Boolean(estimatedRows && selectedCount)}
              />
              <SummaryRow
                label="پوشش"
                value={isFullSelection ? 'کامل ✓' : selectedCount ? `${selectedCount} بخش` : '—'}
              />
              <SummaryRow label="رسانه" value={assetMode === 'urls_only' ? 'فهرست URL' : 'ساختاری'} />
              <SummaryRow label="سطل‌زباله" value={includeTrash ? 'بله' : 'خیر'} />
              <SummaryRow label="فرمت" value="ZIP + JSON" />
            </ul>

            <div className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-2 text-[10px] text-emerald-800 dark:text-emerald-300">
              <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>رمز عبور و API key در خروجی نیست</span>
            </div>

            {lastCompletedJob && (
              <p className="text-[10px] text-[var(--color-text-subtle)] leading-relaxed">
                آخرین خروجی موفق:{' '}
                {new Date(lastCompletedJob.completedAt ?? lastCompletedJob.createdAt).toLocaleString(
                  'fa-IR',
                  { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                )}
                {lastCompletedJob.fileSizeBytes ? ` · ${formatBytes(lastCompletedJob.fileSizeBytes)}` : ''}
              </p>
            )}

            {selectedCount > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {selectedScopes.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-md bg-violet-50 dark:bg-violet-900/25 px-2 py-0.5 text-[10px] text-violet-800 dark:text-violet-200"
                  >
                    {SCOPE_META[s].short}
                    <button
                      type="button"
                      onClick={() => toggleScope(s)}
                      className="hover:text-violet-950 dark:hover:text-white"
                      aria-label={`حذف ${SCOPE_META[s].short}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 px-2.5 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating || hasActive || selectedCount === 0}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-violet-600/20 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating || hasActive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {hasActive ? 'در حال پردازش…' : 'شروع پشتیبان‌گیری'}
            </button>

            <p className="text-[10px] text-center text-[var(--color-text-subtle)] leading-relaxed">
              حداکثر ۱۰ فایل اخیر روی سرور نگه داشته می‌شود
            </p>
          </AdminCard>
        </aside>
      </div>

      <AdminCard padding="default" hover={false} className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)] dark:text-white">تاریخچه خروجی‌ها</h2>
            <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] mt-0.5">
              {jobs.length > 0 ? `${jobs.length} مورد اخیر` : 'آماده برای اولین export'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchJobs(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <RefreshCw className={clsx('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            بروزرسانی
          </button>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="flex justify-center py-14">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : jobs.length === 0 ? (
          <EmptyJobsState onQuickFull={() => applyPreset(PRESETS[0].scopes)} />
        ) : (
          <ul className="space-y-2">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onDownload={handleDownload}
                onPreview={handlePreviewJob}
                previewLoading={previewJobLoading}
              />
            ))}
          </ul>
        )}
      </AdminCard>
        </>
      )}
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString('fa-IR');
}

function getScopeCount(stats: BackupPreviewStats, scope: BackupScope): number | undefined {
  const map: Partial<Record<BackupScope, number>> = {
    categories: stats.categories,
    lists: stats.lists,
    items: stats.items,
    users: stats.users,
    engagement: stats.engagement,
    moderation: stats.moderation,
    suggestions: stats.suggestions,
    settings: stats.settings,
    featured: stats.featured,
  };
  return map[scope];
}

function ScopeChip({
  scope,
  selected,
  count,
  onToggle,
}: {
  scope: BackupScope;
  selected: boolean;
  count?: number;
  onToggle: () => void;
}) {
  const { short, icon: Icon, hint } = SCOPE_META[scope];
  return (
    <button
      type="button"
      onClick={onToggle}
      title={BACKUP_SCOPE_LABELS[scope]}
      className={clsx(
        'inline-flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-sm transition-all min-w-[7.5rem]',
        selected
          ? 'border-violet-400 bg-violet-50 text-violet-900 shadow-sm shadow-violet-500/10 dark:border-violet-500 dark:bg-violet-900/35 dark:text-violet-100'
          : 'border-gray-200 bg-white text-[var(--color-text)] hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800/50 dark:text-[var(--color-text-subtle)]'
      )}
    >
      <span className="flex w-full items-center gap-2">
        <Icon className={clsx('h-4 w-4 shrink-0', selected ? 'text-violet-600 dark:text-violet-300' : 'text-[var(--color-text-subtle)]')} />
        <span className="font-medium">{short}</span>
        {selected && <CheckCircle2 className="h-3.5 w-3.5 ms-auto text-violet-600 dark:text-violet-400" />}
      </span>
      {hint && (
        <span className="text-[10px] text-[var(--color-text-subtle)] dark:text-[var(--color-text-muted)] pr-6 leading-snug">{hint}</span>
      )}
      {count != null && (
        <span className="text-[11px] tabular-nums font-semibold text-violet-700 dark:text-violet-300 pr-6">
          {fmt(count)} رکورد
        </span>
      )}
    </button>
  );
}

function SegmentOption({
  active,
  onClick,
  icon: Icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex-1 sm:flex-none flex items-center gap-2 rounded-lg px-3 py-2 text-right transition-all min-w-[8.5rem]',
        active
          ? 'bg-white dark:bg-gray-700 shadow-sm text-violet-800 dark:text-violet-100'
          : 'text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] hover:text-[var(--color-text)]'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>
        <span className="block text-xs font-semibold">{label}</span>
        <span className="block text-[10px] opacity-70">{sub}</span>
      </span>
    </button>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span
        className={clsx(
          'font-medium tabular-nums',
          highlight ? 'text-violet-700 dark:text-violet-300' : 'text-[var(--color-text)] dark:text-gray-200'
        )}
      >
        {value}
      </span>
    </li>
  );
}

function DataOverviewStrip({
  stats,
  includeTrash,
}: {
  stats: BackupPreviewStats;
  includeTrash: boolean;
}) {
  const tiles = [
    { label: 'دسته', value: stats.categories, icon: Tag },
    { label: 'لیست', value: stats.lists, icon: List },
    { label: 'آیتم', value: stats.items, icon: Package },
    { label: 'کاربر', value: stats.users, icon: Users },
  ] as const;

  return (
    <AdminCard padding="compact" hover={false} className="!py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Database className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
          <span className="text-xs font-medium text-[var(--color-text)] dark:text-[var(--color-text-subtle)]">
            وضعیت فعلی دیتابیس
            {includeTrash ? ' (شامل سطل‌زباله)' : ''}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tiles.map(({ label, value, icon: Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50/80 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800/50"
            >
              <Icon className="h-3.5 w-3.5 text-[var(--color-text-subtle)]" />
              <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">{label}</span>
              <strong className="tabular-nums text-[var(--color-text)] dark:text-white">
                {value.toLocaleString('fa-IR')}
              </strong>
            </span>
          ))}
        </div>
      </div>
    </AdminCard>
  );
}

function ActiveJobBanner({ job }: { job: BackupJobRow }) {
  return (
    <AdminCard variant="info" padding="compact" hover={false} className="!py-3">
      <div className="flex flex-wrap items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
        <div className="flex-1 min-w-[12rem] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-[var(--color-text)] dark:text-white">
              پشتیبان‌گیری در حال اجرا — {STATUS_LABEL[job.status]}
            </p>
            <span className="text-xs font-mono text-blue-700 dark:text-blue-300">{job.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 dark:bg-blue-400 transition-all duration-500"
              style={{ width: `${Math.max(job.progress, 8)}%` }}
            />
          </div>
        </div>
      </div>
    </AdminCard>
  );
}

function EmptyJobsState({ onQuickFull }: { onQuickFull?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/20">
      <Archive className="h-10 w-10 text-[var(--color-text-subtle)] dark:text-[var(--color-text-muted)] mb-3" />
      <p className="text-sm font-medium text-[var(--color-text)] dark:text-[var(--color-text-subtle)]">هنوز خروجی ندارید</p>
      <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] mt-1 max-w-sm leading-relaxed">
        بخش‌ها را انتخاب کنید یا با «پشتیبان کامل» همه داده‌ها را یک‌جا export کنید
      </p>
      {onQuickFull && (
        <button
          type="button"
          onClick={onQuickFull}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700"
        >
          <Sparkles className="h-3.5 w-3.5" />
          پیش‌تنظیم پشتیبان کامل
        </button>
      )}
    </div>
  );
}

function JobCard({
  job,
  onDownload,
  onPreview,
  previewLoading,
}: {
  job: BackupJobRow;
  onDownload: (id: string, fileName: string | null) => void;
  onPreview: (jobId: string) => void;
  previewLoading: boolean;
}) {
  const scopes = parseScopeList(job.scopes);
  const visibleScopes = scopes.slice(0, 4);
  const extra = scopes.length - visibleScopes.length;

  return (
    <li
      className={clsx(
        'rounded-xl border px-4 py-3 transition-colors',
        job.status === 'RUNNING' || job.status === 'PENDING'
          ? 'border-blue-200 bg-blue-50/30 dark:border-blue-500/30 dark:bg-blue-500/5'
          : job.status === 'FAILED'
            ? 'border-red-200/80 bg-red-50/20 dark:border-red-500/20'
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={job.status} />
            <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">
              {new Date(job.createdAt).toLocaleString('fa-IR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {job.fileSizeBytes != null && job.status === 'COMPLETED' && (
              <span className="text-xs text-[var(--color-text-subtle)]">· {formatBytes(job.fileSizeBytes)}</span>
            )}
          </div>

          {(job.status === 'RUNNING' || job.status === 'PENDING') && (
            <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-700 max-w-xs overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-500 transition-all"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          )}

          {job.status === 'FAILED' && job.errorMessage && (
            <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">{job.errorMessage}</p>
          )}

          {job.status === 'COMPLETED' && job.stats && (
            <p className="text-[11px] text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">
              {typeof job.stats.categories === 'number' && (
                <span>دسته {job.stats.categories.toLocaleString('fa-IR')} · </span>
              )}
              {typeof job.stats.lists === 'number' && (
                <span>لیست {job.stats.lists.toLocaleString('fa-IR')} · </span>
              )}
              {typeof job.stats.items === 'number' && (
                <span>آیتم {job.stats.items.toLocaleString('fa-IR')}</span>
              )}
            </p>
          )}

          <div className="flex flex-wrap gap-1">
            {visibleScopes.map((s) => (
              <span
                key={s}
                className="rounded-md bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]"
              >
                {SCOPE_META[s]?.short ?? s}
              </span>
            ))}
            {extra > 0 && (
              <span className="text-[10px] text-[var(--color-text-subtle)] self-center">+{extra}</span>
            )}
            {job.assetMode === 'urls_only' && (
              <span className="rounded-md bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 text-[10px] text-violet-700 dark:text-violet-300">
                URL
              </span>
            )}
            {job.includeTrash && (
              <span className="rounded-md bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-300">
                سطل‌زباله
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex flex-wrap gap-2">
          {job.status === 'COMPLETED' && job.fileName ? (
            <>
              <button
                type="button"
                disabled={previewLoading}
                onClick={() => void onPreview(job.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-xs font-medium text-[var(--color-text)] dark:text-[var(--color-text-subtle)] hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                {previewLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                پیش‌نمایش
              </button>
              <button
                type="button"
                onClick={() => onDownload(job.id, job.fileName)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-violet-700 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                دانلود
              </button>
            </>
          ) : job.status === 'RUNNING' || job.status === 'PENDING' ? (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {job.progress}%
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: JobStatus }) {
  if (status === 'COMPLETED') {
    return (
      <Badge variant="success" className="inline-flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {STATUS_LABEL[status]}
      </Badge>
    );
  }
  if (status === 'FAILED') {
    return (
      <Badge variant="danger" className="inline-flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {STATUS_LABEL[status]}
      </Badge>
    );
  }
  if (status === 'RUNNING') {
    return (
      <Badge variant="warning" className="inline-flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        {STATUS_LABEL[status]}
      </Badge>
    );
  }
  return (
    <Badge variant="neutral" className="inline-flex items-center gap-1">
      <Clock className="h-3 w-3" />
      {STATUS_LABEL[status]}
    </Badge>
  );
}

function arraysEqual(a: BackupScope[], b: BackupScope[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((x) => setB.has(x));
}
