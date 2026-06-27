'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CloudUpload,
  ImageIcon,
  ImageOff,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { PersonRole } from '@/lib/people';

type PersonImageStats = {
  total: number;
  noImage: number;
  onStorage: number;
  external: number;
  tmdbCapable: number;
};

type PersonImageCandidate = {
  role: PersonRole;
  slug: string;
  displayName: string;
};

type BulkProgress = {
  total: number;
  done: number;
  currentName: string;
  fetched: number;
  migrated: number;
  failed: number;
  skipped: number;
  remaining: number;
  errors: string[];
};

const BATCH_SIZE = 25;

export default function PersonImagesSection({
  roleFilter,
  statsEnabled = true,
  onUpdated,
}: {
  roleFilter: PersonRole | 'all';
  statsEnabled?: boolean;
  onUpdated?: () => void;
}) {
  const [stats, setStats] = useState<PersonImageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState<'fetch' | 'migrate' | null>(null);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState<BulkProgress | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      const res = await fetch(`/api/admin/people/images/stats?${params}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setStats(json.data as PersonImageStats);
      }
    } catch {
      /* optional */
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    if (!statsEnabled) return;
    void loadStats();
  }, [loadStats, statsEnabled]);

  const runBulk = async (action: 'fetch_tmdb' | 'migrate_storage') => {
    setBulkLoading(action === 'fetch_tmdb' ? 'fetch' : 'migrate');
    setMessage('');
    setProgress(null);

    try {
      const queueParams = new URLSearchParams({
        action,
        limit: String(BATCH_SIZE),
      });
      if (roleFilter !== 'all') queueParams.set('role', roleFilter);

      const queueRes = await fetch(`/api/admin/people/images/queue?${queueParams}`);
      const queueJson = await queueRes.json();
      if (!queueRes.ok || !queueJson.success) {
        throw new Error(queueJson.error || 'خطا در بارگذاری صف');
      }

      const candidates = queueJson.data.candidates as PersonImageCandidate[];
      const initialRemaining = Number(queueJson.data.remaining ?? 0);
      if (candidates.length === 0) {
        setMessage('موردی برای پردازش باقی نمانده است.');
        return;
      }

      const state: BulkProgress = {
        total: candidates.length,
        done: 0,
        currentName: candidates[0]?.displayName ?? '',
        fetched: 0,
        migrated: 0,
        failed: 0,
        skipped: 0,
        remaining: initialRemaining,
        errors: [],
      };
      setProgress({ ...state });

      for (const person of candidates) {
        state.currentName = person.displayName;
        setProgress({ ...state });

        const endpoint =
          action === 'fetch_tmdb'
            ? `/api/admin/people/${person.role}/${person.slug}/fetch-image`
            : `/api/admin/people/${person.role}/${person.slug}/migrate-image`;

        try {
          const res = await fetch(endpoint, { method: 'POST' });
          const json = await res.json();
          if (!res.ok || !json.success) {
            state.failed += 1;
            state.errors.push(`${person.displayName}: ${json.error || 'خطا'}`);
          } else {
            const status = json.data?.status as string | undefined;
            if (status === 'fetched') state.fetched += 1;
            else if (status === 'migrated') state.migrated += 1;
            else if (status === 'failed') {
              state.failed += 1;
              state.errors.push(`${person.displayName}: ${json.data?.error || 'خطا'}`);
            } else state.skipped += 1;
          }
        } catch (err) {
          state.failed += 1;
          state.errors.push(
            `${person.displayName}: ${err instanceof Error ? err.message : 'خطای شبکه'}`
          );
        }

        state.done += 1;
        setProgress({ ...state });
      }

      const parts = [
        `${state.done.toLocaleString('fa-IR')} پردازش شد`,
        state.fetched > 0 ? `${state.fetched.toLocaleString('fa-IR')} دریافت از TMDB` : null,
        state.migrated > 0 ? `${state.migrated.toLocaleString('fa-IR')} آپلود به استوریج` : null,
        state.failed > 0 ? `${state.failed.toLocaleString('fa-IR')} خطا` : null,
        state.skipped > 0 ? `${state.skipped.toLocaleString('fa-IR')} رد شد` : null,
        state.remaining > 0 ? `${state.remaining.toLocaleString('fa-IR')} باقی‌مانده` : null,
      ].filter(Boolean);
      setMessage(parts.join(' · '));
      void loadStats();
      onUpdated?.();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'خطا');
    } finally {
      setBulkLoading(null);
      setProgress((current) => (current ? { ...current, currentName: '' } : null));
    }
  };

  const progressPercent =
    progress && progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <ImageIcon className="h-4 w-4 text-violet-600" />
            تصاویر پروفایل
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
            دریافت از TMDB (با IMDb/slug لاتین) و ذخیره روی ParsPack. برای نویسنده/مترجم URL را
            دستی یا در JSON import وارد کنید.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadStats()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
          aria-label="بارگذاری آمار تصاویر"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {stats && (
        <div className="flex flex-wrap gap-2">
          <StatPill icon={ImageOff} label="بدون تصویر" value={stats.noImage} tone="amber" />
          <StatPill icon={CloudUpload} label="روی استوریج" value={stats.onStorage} tone="emerald" />
          <StatPill icon={ImageIcon} label="لینک خارجی" value={stats.external} tone="sky" />
        </div>
      )}

      {progress && bulkLoading && (
        <div className="space-y-2 rounded-xl bg-[var(--color-bg)] p-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-[var(--color-text)]">
              {progress.done.toLocaleString('fa-IR')} / {progress.total.toLocaleString('fa-IR')}
            </span>
            <span className="text-[var(--color-text-muted)]">{progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
            <div
              className="h-full rounded-full bg-violet-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {progress.currentName && (
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              در حال پردازش: {progress.currentName}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={bulkLoading != null || loading}
          onClick={() => void runBulk('fetch_tmdb')}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {bulkLoading === 'fetch' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          دریافت از TMDB (۲۵ نفر)
        </button>
        <button
          type="button"
          disabled={bulkLoading != null || loading}
          onClick={() => void runBulk('migrate_storage')}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs font-semibold hover:bg-[var(--color-surface)] disabled:opacity-60"
        >
          {bulkLoading === 'migrate' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CloudUpload className="h-3.5 w-3.5" />
          )}
          آپلود خارجی‌ها به ParsPack
        </button>
      </div>

      {message && (
        <p className="rounded-lg bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
          {message}
        </p>
      )}

      {progress?.errors.length ? (
        <details className="rounded-lg border border-amber-200/60 bg-amber-50/70 px-3 py-2 text-xs dark:border-amber-900/40 dark:bg-amber-950/20">
          <summary className="cursor-pointer font-medium text-amber-900 dark:text-amber-200">
            جزئیات {progress.errors.length.toLocaleString('fa-IR')} خطا
          </summary>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-amber-900/90 dark:text-amber-100/90">
            {progress.errors.slice(0, 12).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
      ) : null}

      <p className="text-[11px] text-[var(--color-text-muted)]">
        کلید TMDB در{' '}
        <Link href="/admin/settings?tab=integrations" className="text-violet-600 underline">
          تنظیمات یکپارچه‌سازی
        </Link>{' '}
        · پوشه استوریج: <span dir="ltr">people/</span>
      </p>
    </section>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ImageIcon;
  label: string;
  value: number;
  tone: 'amber' | 'emerald' | 'sky';
}) {
  const tones = {
    amber: 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200',
    emerald: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200',
    sky: 'bg-sky-50 text-sky-800 dark:bg-sky-950/30 dark:text-sky-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${tones[tone]}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}: {value.toLocaleString('fa-IR')}
    </span>
  );
}
