'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  UserRound,
} from 'lucide-react';
import {
  PERSON_ROLE_META,
  PERSON_ROLES,
  personPagePath,
  type PersonRole,
} from '@/lib/people';
import type { DiscoveredPerson, PersonProfileRecord } from '@/lib/person-profiles';

type EditState = {
  displayName: string;
  bio: string;
  imageUrl: string;
  externalUrl: string;
  status: 'draft' | 'published';
};

const EMPTY_EDIT: EditState = {
  displayName: '',
  bio: '',
  imageUrl: '',
  externalUrl: '',
  status: 'published',
};

export default function PeoplePageClient() {
  const [roleFilter, setRoleFilter] = useState<PersonRole | 'all'>('all');
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<DiscoveredPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState<DiscoveredPerson | null>(null);
  const [edit, setEdit] = useState<EditState>(EMPTY_EDIT);
  const [profile, setProfile] = useState<PersonProfileRecord | null>(null);
  const [itemCount, setItemCount] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const loadPeople = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (query.trim()) params.set('q', query.trim());
      const res = await fetch(`/api/admin/people?${params}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در بارگذاری');
      }
      setPeople(json.data as DiscoveredPerson[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری');
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPeople();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [loadPeople]);

  const openEditor = async (person: DiscoveredPerson) => {
    setSelected(person);
    setDetailLoading(true);
    setSaveMessage('');
    setProfile(null);
    setEdit({
      displayName: person.displayName,
      bio: '',
      imageUrl: '',
      externalUrl: '',
      status: 'published',
    });
    setItemCount(person.itemCount);

    try {
      const res = await fetch(`/api/admin/people/${person.role}/${person.slug}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در بارگذاری پروفایل');
      }
      const p = json.data.profile as PersonProfileRecord | null;
      setProfile(p);
      if (p) {
        setEdit({
          displayName: p.displayName,
          bio: p.bio ?? '',
          imageUrl: p.imageUrl ?? '',
          externalUrl: p.externalUrl ?? '',
          status: p.status,
        });
      }
      if (json.data.discovered?.itemCount != null) {
        setItemCount(json.data.discovered.itemCount);
      }
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'خطا در بارگذاری جزئیات');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeEditor = () => {
    setSelected(null);
    setProfile(null);
    setSaveMessage('');
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch(`/api/admin/people/${selected.role}/${selected.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: edit.displayName,
          bio: edit.bio,
          imageUrl: edit.imageUrl || null,
          externalUrl: edit.externalUrl || null,
          status: edit.status,
          tmdbId: profile?.tmdbId ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در ذخیره');
      }
      setProfile(json.data as PersonProfileRecord);
      setSaveMessage('ذخیره شد');
      void loadPeople();
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  };

  const handleEnrich = async () => {
    if (!selected) return;
    setEnriching(true);
    setSaveMessage('');
    try {
      const res = await fetch(`/api/admin/people/${selected.role}/${selected.slug}/enrich`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'خطا در تکمیل از وب');
      }
      const p = json.data as PersonProfileRecord;
      setProfile(p);
      setEdit({
        displayName: p.displayName,
        bio: p.bio ?? '',
        imageUrl: p.imageUrl ?? '',
        externalUrl: p.externalUrl ?? '',
        status: p.status,
      });
      setSaveMessage('از TMDB تکمیل شد — در صورت نیاز ویرایش و ذخیره کنید');
      void loadPeople();
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'خطا در تکمیل از وب');
    } finally {
      setEnriching(false);
    }
  };

  const canEnrich = selected && (selected.role === 'director' || selected.role === 'actor');

  const stats = useMemo(() => {
    const withProfile = people.filter((p) => p.hasProfile).length;
    return { total: people.length, withProfile };
  }, [people]);

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-indigo-100 bg-gradient-to-l from-indigo-600 to-violet-600 px-5 py-5 text-white shadow-sm md:px-6">
        <h1 className="text-xl font-bold md:text-2xl">اشخاص</h1>
        <p className="mt-1 text-sm text-white/75">
          مدیریت پروفایل کارگردان، بازیگر، نویسنده و مترجم — لیست آثار خودکار از آیتم‌های سایت
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10">
            {stats.total.toLocaleString('fa-IR')} شخص کشف‌شده
          </span>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-100 ring-1 ring-emerald-400/20">
            {stats.withProfile.toLocaleString('fa-IR')} با پروفایل
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-1.5">
              <FilterChip
                active={roleFilter === 'all'}
                onClick={() => setRoleFilter('all')}
                label="همه"
              />
              {PERSON_ROLES.map((role) => (
                <FilterChip
                  key={role}
                  active={roleFilter === role}
                  onClick={() => setRoleFilter(role)}
                  label={PERSON_ROLE_META[role].label}
                />
              ))}
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xs sm:ms-auto">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی نام…"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void loadPeople()}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
                aria-label="بارگذاری مجدد"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-[var(--color-text-muted)]">
                <Loader2 className="h-5 w-5 animate-spin" />
                در حال بارگذاری…
              </div>
            ) : people.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-[var(--color-text-muted)]">
                شخصی پیدا نشد
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[var(--color-bg)] text-[var(--color-text-muted)]">
                    <tr>
                      <th className="px-4 py-3 text-right font-medium">نام</th>
                      <th className="px-4 py-3 text-right font-medium">نقش</th>
                      <th className="px-4 py-3 text-right font-medium">آیتم‌ها</th>
                      <th className="px-4 py-3 text-right font-medium">پروفایل</th>
                      <th className="px-4 py-3 text-left font-medium">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map((person) => {
                      const isSelected =
                        selected?.role === person.role && selected?.slug === person.slug;
                      return (
                        <tr
                          key={`${person.role}:${person.slug}`}
                          className={`border-t border-[var(--color-border)] ${
                            isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                            {person.displayName}
                          </td>
                          <td className="px-4 py-3 text-[var(--color-text-muted)]">
                            {PERSON_ROLE_META[person.role].icon}{' '}
                            {PERSON_ROLE_META[person.role].label}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {person.itemCount.toLocaleString('fa-IR')}
                          </td>
                          <td className="px-4 py-3">
                            {person.hasProfile ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                {person.profileStatus === 'draft' ? 'پیش‌نویس' : 'منتشر'}
                              </span>
                            ) : (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                ندارد
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-left">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={personPagePath(person.role, person.displayName)}
                                target="_blank"
                                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                صفحه
                              </Link>
                              <button
                                type="button"
                                onClick={() => void openEditor(person)}
                                className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--color-bg)]"
                              >
                                ویرایش
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {selected && (
          <aside className="w-full shrink-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:w-[22rem] xl:w-[24rem]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {PERSON_ROLE_META[selected.role].label}
                </p>
                <h2 className="text-lg font-bold text-[var(--color-text)]">{selected.displayName}</h2>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {itemCount.toLocaleString('fa-IR')} آیتم در سایت
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                بستن
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--color-text-muted)]">
                <Loader2 className="h-5 w-5 animate-spin" />
                بارگذاری…
              </div>
            ) : (
              <div className="space-y-4">
                {canEnrich && (
                  <button
                    type="button"
                    onClick={() => void handleEnrich()}
                    disabled={enriching || saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                  >
                    {enriching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    تکمیل از TMDB
                  </button>
                )}

                <Field label="نام نمایشی">
                  <input
                    value={edit.displayName}
                    onChange={(e) => setEdit((s) => ({ ...s, displayName: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                  />
                </Field>

                <Field label="توضیح کوتاه (bio)">
                  <textarea
                    value={edit.bio}
                    onChange={(e) => setEdit((s) => ({ ...s, bio: e.target.value }))}
                    rows={5}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm leading-relaxed"
                    placeholder="اگر خالی بماند، متن پیش‌فرض از تعداد آیتم‌ها ساخته می‌شود"
                  />
                </Field>

                <Field label="آدرس تصویر">
                  <input
                    value={edit.imageUrl}
                    onChange={(e) => setEdit((s) => ({ ...s, imageUrl: e.target.value }))}
                    dir="ltr"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                    placeholder="https://…"
                  />
                </Field>

                <Field label="لینک خارجی">
                  <input
                    value={edit.externalUrl}
                    onChange={(e) => setEdit((s) => ({ ...s, externalUrl: e.target.value }))}
                    dir="ltr"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                  />
                </Field>

                <Field label="وضعیت">
                  <select
                    value={edit.status}
                    onChange={(e) =>
                      setEdit((s) => ({
                        ...s,
                        status: e.target.value as 'draft' | 'published',
                      }))
                    }
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                  >
                    <option value="published">منتشر شده</option>
                    <option value="draft">پیش‌نویس</option>
                  </select>
                </Field>

                {saveMessage && (
                  <p className="text-sm text-[var(--color-text-muted)]">{saveMessage}</p>
                )}

                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || enriching}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  ذخیره پروفایل
                </button>

                <Link
                  href={personPagePath(selected.role, edit.displayName || selected.displayName)}
                  target="_blank"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-bg)]"
                >
                  <UserRound className="h-4 w-4" />
                  مشاهده صفحه عمومی
                </Link>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
      }`}
    >
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}
