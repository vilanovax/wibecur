'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Plus, Search, X } from 'lucide-react';

export type SeedTargetKind = 'item' | 'list' | 'category';

type TargetOption = {
  id: string;
  title: string;
  subtitle?: string;
};

type CategoryRow = {
  id: string;
  name: string;
  icon?: string | null;
  isActive?: boolean;
};

type ListRow = {
  id: string;
  title: string;
  categories?: { name: string } | null;
  _count?: { items: number };
};

type ItemRow = {
  id: string;
  title: string;
  lists?: { title: string; categories?: { name: string } | null };
};

interface CommentSeedTargetPickerProps {
  targetType: SeedTargetKind;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** چندانتخابی (کمپین) یا تک‌انتخابی (قوانین) */
  multiple?: boolean;
  disabled?: boolean;
}

function normalizeText(s: string) {
  return s.trim().toLowerCase();
}

export default function CommentSeedTargetPicker({
  targetType,
  selectedIds,
  onChange,
  multiple = true,
  disabled = false,
}: CommentSeedTargetPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [lists, setLists] = useState<ListRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);

  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterListId, setFilterListId] = useState('');

  const [labelMap, setLabelMap] = useState<Record<string, TargetOption>>({});

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const mergeLabels = useCallback((options: TargetOption[]) => {
    if (options.length === 0) return;
    setLabelMap((prev) => {
      const next = { ...prev };
      for (const o of options) next[o.id] = o;
      return next;
    });
  }, []);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/categories?includeInactive=true');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در دریافت دسته‌ها');
      const rows: CategoryRow[] = Array.isArray(data) ? data : [];
      setCategories(rows);
      mergeLabels(
        rows.map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: c.isActive === false ? 'غیرفعال' : undefined,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [mergeLabels]);

  const loadLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ includeInactive: 'true' });
      if (filterCategoryId) params.set('categoryId', filterCategoryId);
      const res = await fetch(`/api/admin/lists?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در دریافت لیست‌ها');
      const rows: ListRow[] = Array.isArray(data) ? data : [];
      setLists(rows);
      mergeLabels(
        rows.map((l) => ({
          id: l.id,
          title: l.title,
          subtitle: l.categories?.name,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
      setLists([]);
    } finally {
      setLoading(false);
    }
  }, [filterCategoryId, mergeLabels]);

  const loadItems = useCallback(async () => {
    if (!filterListId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ listId: filterListId });
      if (query.trim().length >= 2) params.set('q', query.trim());
      const res = await fetch(`/api/admin/items?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در دریافت آیتم‌ها');
      const rows: ItemRow[] = Array.isArray(data) ? data : [];
      setItems(rows);
      mergeLabels(
        rows.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: item.lists?.categories?.name
            ? `${item.lists.title} · ${item.lists.categories.name}`
            : item.lists?.title,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filterListId, query, mergeLabels]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setError(null);
    if (targetType === 'category') void loadCategories();
    if (targetType === 'list') void loadLists();
    if (targetType === 'item') {
      setFilterListId('');
      setItems([]);
      void loadCategories();
      void loadLists();
    }
  }, [open, targetType, loadCategories, loadLists]);

  useEffect(() => {
    if (!open || targetType !== 'list') return;
    void loadLists();
  }, [open, targetType, filterCategoryId, loadLists]);

  useEffect(() => {
    if (!open || targetType !== 'item') return;
    void loadLists();
  }, [open, targetType, filterCategoryId, loadLists]);

  useEffect(() => {
    if (!open || targetType !== 'item' || !filterListId) return;
    const t = setTimeout(() => void loadItems(), query.trim().length >= 2 ? 300 : 0);
    return () => clearTimeout(t);
  }, [open, targetType, filterListId, query, loadItems]);

  useEffect(() => {
    const missing = selectedIds.filter((id) => !labelMap[id]);
    if (missing.length === 0) return;

    if (targetType === 'category') {
      void loadCategories();
      return;
    }
    if (targetType === 'list') {
      void loadLists();
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/admin/items?ids=${missing.join(',')}`);
        const data = await res.json();
        if (!res.ok) return;
        const rows: ItemRow[] = Array.isArray(data) ? data : [];
        mergeLabels(
          rows.map((item) => ({
            id: item.id,
            title: item.title,
            subtitle: item.lists?.title,
          }))
        );
      } catch {
        /* ignore */
      }
    })();
  }, [selectedIds, targetType, labelMap, loadCategories, loadLists, mergeLabels]);

  const modalOptions = useMemo((): TargetOption[] => {
    const q = normalizeText(query);
    if (targetType === 'category') {
      return categories
        .filter((c) => !q || normalizeText(c.name).includes(q))
        .map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: c.isActive === false ? 'غیرفعال' : undefined,
        }));
    }
    if (targetType === 'list') {
      return lists
        .filter((l) => !q || normalizeText(l.title).includes(q))
        .map((l) => ({
          id: l.id,
          title: l.title,
          subtitle: [
            l.categories?.name,
            l._count?.items != null ? `${l._count.items} آیتم` : null,
          ]
            .filter(Boolean)
            .join(' · '),
        }));
    }
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.lists?.categories?.name
        ? `${item.lists.title} · ${item.lists.categories.name}`
        : item.lists?.title,
    }));
  }, [targetType, categories, lists, items, query]);

  function toggleId(id: string) {
    if (multiple) {
      if (selectedSet.has(id)) {
        onChange(selectedIds.filter((x) => x !== id));
      } else {
        onChange([...selectedIds, id]);
      }
      return;
    }
    onChange([id]);
    setOpen(false);
  }

  function removeId(id: string) {
    onChange(selectedIds.filter((x) => x !== id));
  }

  const pickerTitle =
    targetType === 'category'
      ? 'انتخاب دسته'
      : targetType === 'list'
        ? 'انتخاب لیست'
        : 'انتخاب آیتم';

  const addButtonLabel =
    targetType === 'category'
      ? multiple
        ? 'افزودن دسته'
        : 'انتخاب دسته'
      : targetType === 'list'
        ? multiple
          ? 'افزودن لیست'
          : 'انتخاب لیست'
        : multiple
          ? 'افزودن آیتم'
          : 'انتخاب آیتم';

  return (
    <div className="space-y-2">
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const label = labelMap[id]?.title ?? id.slice(0, 8) + '…';
            const sub = labelMap[id]?.subtitle;
            return (
              <span
                key={id}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs"
              >
                <span className="min-w-0 truncate font-medium text-[var(--color-text)]">{label}</span>
                {sub && (
                  <span className="hidden truncate text-[var(--color-text-muted)] sm:inline">({sub})</span>
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeId(id)}
                    className="shrink-0 rounded-full p-0.5 text-[var(--color-text-muted)] hover:bg-white hover:text-rose-600"
                    aria-label="حذف"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-primary transition hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {addButtonLabel}
        {multiple && selectedIds.length > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs tabular-nums text-primary">
            {selectedIds.length.toLocaleString('fa-IR')}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
            aria-label="بستن"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative flex max-h-[min(85vh,640px)] w-full max-w-lg flex-col rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl sm:rounded-2xl"
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <h3 className="text-base font-semibold text-[var(--color-text)]">{pickerTitle}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 border-b border-[var(--color-border)] px-4 py-3">
              {targetType === 'list' && (
                <select
                  value={filterCategoryId}
                  onChange={(e) => setFilterCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                >
                  <option value="">همه دسته‌ها</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              {targetType === 'item' && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={filterCategoryId}
                    onChange={(e) => {
                      setFilterCategoryId(e.target.value);
                      setFilterListId('');
                    }}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                  >
                    <option value="">فیلتر دسته</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterListId}
                    onChange={(e) => setFilterListId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                    disabled={lists.length === 0 && !filterCategoryId}
                  >
                    <option value="">انتخاب لیست</option>
                    {lists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(targetType === 'category' || targetType === 'list') && (
                <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="جستجو…"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2.5 pr-10 pl-3 text-sm"
                  />
                </div>
              )}

              {targetType === 'item' && filterListId && (
                <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="جستجو در آیتم‌های لیست…"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2.5 pr-10 pl-3 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--color-text-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال بارگذاری…
                </div>
              )}

              {!loading && error && (
                <p className="px-3 py-8 text-center text-sm text-rose-600">{error}</p>
              )}

              {!loading && !error && targetType === 'item' && !filterListId && (
                <p className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
                  ابتدا یک لیست انتخاب کنید
                </p>
              )}

              {!loading && !error && (targetType !== 'item' || filterListId) && modalOptions.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
                  موردی یافت نشد
                </p>
              )}

              {!loading &&
                !error &&
                modalOptions.map((opt) => {
                  const checked = selectedSet.has(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleId(opt.id)}
                      className={`mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-right text-sm transition ${
                        checked ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-[var(--color-bg)]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          checked
                            ? 'border-primary bg-primary text-white'
                            : 'border-[var(--color-border)] bg-white'
                        }`}
                      >
                        {checked && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-[var(--color-text)]">{opt.title}</span>
                        {opt.subtitle && (
                          <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">
                            {opt.subtitle}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
            </div>

            {multiple && (
              <div className="border-t border-[var(--color-border)] px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  تأیید ({selectedIds.length.toLocaleString('fa-IR')} انتخاب)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
