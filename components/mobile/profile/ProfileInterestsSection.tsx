'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Pencil, Check, X } from 'lucide-react';

type KeywordOption = {
  id: string;
  label: string;
  emoji: string;
  group: string;
};

type KeywordGroup = {
  group: string;
  label: string;
  keywords: KeywordOption[];
};

type UserInterest = {
  keywordId: string;
  label: string;
  emoji: string;
  source: 'manual' | 'inferred';
  pinned: boolean;
};

async function fetchKeywordCatalog(): Promise<KeywordGroup[]> {
  const res = await fetch('/api/interests/keywords');
  const json = await res.json();
  if (!res.ok || !json.success) return [];
  return json.data?.groups ?? [];
}

async function fetchInterests(): Promise<UserInterest[]> {
  const res = await fetch('/api/user/interests');
  const json = await res.json();
  if (!res.ok || !json.success) return [];
  return json.data?.interests ?? [];
}

async function saveInterests(pinnedKeywordIds: string[]): Promise<UserInterest[]> {
  const res = await fetch('/api/user/interests', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinnedKeywordIds }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? 'خطا در ذخیره');
  return json.data?.interests ?? [];
}

const MAX_PINNED = 12;

export default function ProfileInterestsSection() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: catalog = [] } = useQuery({
    queryKey: ['interests', 'keywords'],
    queryFn: fetchKeywordCatalog,
    staleTime: 60 * 60 * 1000,
  });

  const { data: interests = [], isLoading } = useQuery({
    queryKey: ['user', 'interests'],
    queryFn: fetchInterests,
    staleTime: 60 * 1000,
  });

  const pinnedIds = useMemo(
    () => interests.filter((i) => i.pinned).map((i) => i.keywordId),
    [interests]
  );

  const inferredIds = useMemo(
    () =>
      interests
        .filter((i) => !i.pinned && i.source === 'inferred')
        .slice(0, 6)
        .map((i) => i.keywordId),
    [interests]
  );

  useEffect(() => {
    if (editing) {
      setSelected(pinnedIds.length > 0 ? pinnedIds : inferredIds.slice(0, 4));
    }
  }, [editing, pinnedIds, inferredIds]);

  const toggleKeyword = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= MAX_PINNED) return prev;
      return [...prev, id];
    });
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      await saveInterests(selected);
      await queryClient.invalidateQueries({ queryKey: ['user', 'interests'] });
      setEditing(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در ذخیره علایق');
    } finally {
      setSaving(false);
    }
  }, [queryClient, selected]);

  const displayInterests =
    pinnedIds.length > 0
      ? interests.filter((i) => i.pinned)
      : interests.filter((i) => i.source === 'inferred').slice(0, 8);

  return (
    <section
      className="mb-4 overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm lg:mb-5"
      aria-label="علاقه‌مندی‌ها"
    >
      <div className="flex items-center justify-between gap-2 border-b border-wibe/50 px-3 py-2.5 lg:px-4">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="wibe-body font-bold text-foreground">علاقه‌مندی‌ها</h2>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 wibe-caption font-medium text-primary hover:text-primary/80"
          >
            <Pencil className="h-3.5 w-3.5" />
            ویرایش
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1 wibe-caption text-wibe-secondary hover:text-foreground"
              disabled={saving}
            >
              <X className="h-3.5 w-3.5" />
              انصراف
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || selected.length === 0}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 wibe-caption font-medium text-white disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? 'ذخیره…' : 'ذخیره'}
            </button>
          </div>
        )}
      </div>

      <div className="px-3 py-3 lg:px-4 lg:py-4">
        {editing ? (
          <>
            <p className="mb-3 wibe-small text-wibe-secondary">
              تا {MAX_PINNED.toLocaleString('fa-IR')} کلمه کلیدی انتخاب کن — مثل «اکشن»، «قهوه»،
              «تهران». پیشنهاد اکسپلور بر اساس این‌ها و بازدیدهایت شخصی‌سازی می‌شود.
            </p>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {catalog.map((group) => (
                <div key={group.group}>
                  <p className="mb-1.5 wibe-caption font-semibold text-wibe-secondary">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.keywords.map((kw) => {
                      const isSelected = selected.includes(kw.id);
                      return (
                        <button
                          key={kw.id}
                          type="button"
                          onClick={() => toggleKeyword(kw.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 wibe-small transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : 'border-wibe bg-wibe-surface text-foreground hover:border-primary/40'
                          }`}
                        >
                          <span>{kw.emoji}</span>
                          <span>{kw.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {error ? <p className="mt-2 wibe-caption text-red-600">{error}</p> : null}
          </>
        ) : isLoading ? (
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-gray-200" />
            ))}
          </div>
        ) : displayInterests.length === 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="wibe-small text-wibe-secondary">
              هنوز علایق مشخصی نداری — با مرور لیست‌ها، کلمات کلیدی از tags و بازدیدها استنتاج
              می‌شوند.
            </p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 wibe-caption font-medium text-primary"
            >
              انتخاب علایق
            </button>
          </div>
        ) : (
          <>
            <p className="mb-2.5 wibe-small text-wibe-secondary">
              {pinnedIds.length > 0
                ? 'کلمات انتخابی تو + بازدیدهای اخیر'
                : 'بر اساس tags، بازدیدها و ذخیره‌هایت'}
            </p>
            <div className="flex flex-wrap gap-2">
              {displayInterests.map((interest) => (
                <span
                  key={interest.keywordId}
                  className="inline-flex items-center gap-1.5 rounded-full border border-wibe bg-wibe-surface px-3 py-1.5 wibe-small"
                >
                  <span>{interest.emoji}</span>
                  <span>{interest.label}</span>
                  {interest.pinned ? (
                    <span className="text-[10px] text-primary">★</span>
                  ) : null}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
