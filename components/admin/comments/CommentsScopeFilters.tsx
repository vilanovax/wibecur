'use client';

import { useCallback, useEffect, useState } from 'react';
import { FolderOpen, List, User, X } from 'lucide-react';
import {
  COMMENT_ORIGIN_OPTIONS,
  type CommentOriginKind,
} from '@/lib/admin/comments-scope-utils';

type CategoryRow = { id: string; name: string; icon?: string | null };
type ListRow = { id: string; title: string };

type Props = {
  origin: CommentOriginKind;
  categoryId: string;
  listId: string;
  onOriginChange: (origin: CommentOriginKind) => void;
  onCategoryChange: (categoryId: string) => void;
  onListChange: (listId: string) => void;
};

export default function CommentsScopeFilters({
  origin,
  categoryId,
  listId,
  onOriginChange,
  onCategoryChange,
  onListChange,
}: Props) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [lists, setLists] = useState<ListRow[]>([]);
  const [listsLoading, setListsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/categories?includeInactive=true');
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data)) {
          setCategories(data);
        }
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadLists = useCallback(async (catId: string) => {
    setListsLoading(true);
    try {
      const params = new URLSearchParams({ includeInactive: 'true' });
      if (catId) params.set('categoryId', catId);
      const res = await fetch(`/api/admin/lists?${params}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setLists(data);
      } else {
        setLists([]);
      }
    } catch {
      setLists([]);
    } finally {
      setListsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLists(categoryId);
  }, [categoryId, loadLists]);

  const handleCategoryChange = (next: string) => {
    onCategoryChange(next);
    onListChange('');
  };

  const selectClass =
    'py-1.5 px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm min-w-0 max-w-full';

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--color-border-muted)]">
      <label className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] shrink-0">
        <User className="w-3.5 h-3.5" />
        <span className="whitespace-nowrap">منبع</span>
        <select
          value={origin}
          onChange={(e) => onOriginChange(e.target.value as CommentOriginKind)}
          className={selectClass}
          aria-label="فیلتر منبع کامنت"
        >
          {COMMENT_ORIGIN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] min-w-[10rem] flex-1 sm:flex-none">
        <FolderOpen className="w-3.5 h-3.5 shrink-0" />
        <span className="whitespace-nowrap">دسته</span>
        <select
          value={categoryId}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className={`${selectClass} flex-1 sm:max-w-[14rem]`}
          aria-label="فیلتر دسته"
        >
          <option value="">همه دسته‌ها</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ` : ''}
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] min-w-[10rem] flex-1 sm:flex-none">
        <List className="w-3.5 h-3.5 shrink-0" />
        <span className="whitespace-nowrap">لیست</span>
        <select
          value={listId}
          onChange={(e) => onListChange(e.target.value)}
          disabled={listsLoading}
          className={`${selectClass} flex-1 sm:max-w-[16rem] disabled:opacity-60`}
          aria-label="فیلتر لیست"
        >
          <option value="">همه لیست‌ها</option>
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
      </label>

      {(origin !== 'all' || categoryId || listId) && (
        <button
          type="button"
          onClick={() => {
            onOriginChange('all');
            onCategoryChange('');
            onListChange('');
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 dark:text-violet-300 dark:bg-violet-950/40"
        >
          <X className="w-3 h-3" />
          پاک کردن فیلتر محدوده
        </button>
      )}
    </div>
  );
}
