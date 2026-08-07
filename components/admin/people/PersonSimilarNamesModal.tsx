'use client';

import { useCallback, useEffect, useState } from 'react';
import { GitMerge, Loader2, RefreshCw, X } from 'lucide-react';
import { PERSON_ROLE_META, type PersonRole } from '@/lib/people';
import type { SimilarPersonGroup } from '@/lib/person-name-similarity';

type Props = {
  open: boolean;
  onClose: () => void;
  roleFilter: PersonRole | 'all';
  onMerged: () => void;
};

export default function PersonSimilarNamesModal({ open, onClose, roleFilter, onMerged }: Props) {
  const [groups, setGroups] = useState<SimilarPersonGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [mergingKey, setMergingKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [canonicalByGroup, setCanonicalByGroup] = useState<Record<string, string>>({});

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const params = new URLSearchParams({ minScore: '0.84' });
      if (roleFilter !== 'all') params.set('role', roleFilter);

      const res = await fetch(`/api/admin/people/similar-names?${params}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در بارگذاری');
      }

      const nextGroups = json.data.groups as SimilarPersonGroup[];
      setGroups(nextGroups);
      setCanonicalByGroup(
        Object.fromEntries(
          nextGroups.map((group) => [
            groupKey(group),
            group.suggestedCanonicalSlug,
          ])
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    if (!open) return;
    void loadGroups();
  }, [open, loadGroups]);

  const handleMerge = async (group: SimilarPersonGroup) => {
    const key = groupKey(group);
    const canonicalSlug = canonicalByGroup[key] ?? group.suggestedCanonicalSlug;
    const canonical = group.members.find((member) => member.slug === canonicalSlug);
    if (!canonical) return;

    const aliases = group.members.filter((member) => member.slug !== canonical.slug);
    setMergingKey(key);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/people/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: group.role,
          canonicalSlug: canonical.slug,
          canonicalDisplayName: canonical.displayName,
          aliases: aliases.map((member) => ({
            slug: member.slug,
            displayName: member.displayName,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در ادغام');
      }

      setMessage(`«${canonical.displayName}» با ${aliases.length.toLocaleString('fa-IR')} نام مشابه ادغام شد`);
      setGroups((current) => current.filter((item) => groupKey(item) !== key));
      onMerged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ادغام');
    } finally {
      setMergingKey(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-6">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text)]">
              <GitMerge className="h-4 w-4 text-violet-600" />
              ادغام نام‌های مشابه
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
              موارد با املای نزدیک (مثل «استفن کینگ» و «استیفن کینگ») را بررسی کنید، نام اصلی را
              انتخاب کنید و پس از تایید ادغام کنید.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-2 sm:px-5">
          <span className="text-xs text-[var(--color-text-muted)]">
            {groups.length.toLocaleString('fa-IR')} پیشنهاد
          </span>
          <button
            type="button"
            onClick={() => void loadGroups()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs hover:bg-[var(--color-bg)] disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-3 sm:px-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--color-text-muted)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال بررسی نام‌ها…
            </div>
          ) : groups.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">
              نام مشابهی برای ادغام پیدا نشد
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const key = groupKey(group);
                const selectedSlug = canonicalByGroup[key] ?? group.suggestedCanonicalSlug;
                return (
                  <article
                    key={key}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-3 sm:p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-800 dark:bg-violet-900/30 dark:text-violet-200">
                        {PERSON_ROLE_META[group.role].label}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        شباهت {Math.round(group.score * 100).toLocaleString('fa-IR')}٪
                      </span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">{group.reason}</span>
                    </div>

                    <div className="space-y-2">
                      {group.members.map((member) => {
                        const checked = selectedSlug === member.slug;
                        return (
                          <label
                            key={member.slug}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                              checked
                                ? 'border-violet-400 bg-violet-50/70 dark:border-violet-700 dark:bg-violet-950/20'
                                : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`canonical-${key}`}
                              checked={checked}
                              onChange={() =>
                                setCanonicalByGroup((current) => ({
                                  ...current,
                                  [key]: member.slug,
                                }))
                              }
                              className="mt-1"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-[var(--color-text)]">
                                {member.displayName}
                              </div>
                              <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                                slug: {member.slug} · {member.itemCount.toLocaleString('fa-IR')} آیتم
                                {member.hasBio ? ' · bio دارد' : ' · بدون bio'}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={mergingKey === key}
                        onClick={() => void handleMerge(group)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-60"
                      >
                        {mergingKey === key ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <GitMerge className="h-3.5 w-3.5" />
                        )}
                        ادغام با نام انتخاب‌شده
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {(error || message) && (
          <div className="border-t border-[var(--color-border)] px-4 py-3 sm:px-5">
            {error && (
              <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
            )}
            {message && (
              <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function groupKey(group: SimilarPersonGroup): string {
  return `${group.role}:${group.members
    .map((member) => member.slug)
    .sort()
    .join('|')}`;
}
