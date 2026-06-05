'use client';

import clsx from 'clsx';
import { CheckCircle2, Tag, List, Package } from 'lucide-react';
import type { ContentScope } from '@/lib/admin/backup/types';
import { CONTENT_SCOPES } from '@/lib/admin/backup/types';
import type { BackupPreviewStats } from '@/lib/admin/backup/stats';

const TILE_META: Record<
  ContentScope,
  { label: string; sub: string; icon: typeof Tag; statKey: keyof Pick<BackupPreviewStats, 'categories' | 'lists' | 'items'> }
> = {
  categories: { label: 'دسته‌بندی‌ها', sub: 'categories.json', icon: Tag, statKey: 'categories' },
  lists: { label: 'لیست‌ها', sub: 'lists.json', icon: List, statKey: 'lists' },
  items: { label: 'آیتم‌ها', sub: 'items.json', icon: Package, statKey: 'items' },
};

type Props = {
  selected: ContentScope[];
  stats: BackupPreviewStats | null;
  statsLoading: boolean;
  onToggle: (scope: ContentScope) => void;
  onSelectAll: () => void;
};

export default function BackupContentCore({
  selected,
  stats,
  statsLoading,
  onToggle,
  onSelectAll,
}: Props) {
  const allSelected = CONTENT_SCOPES.every((s) => selected.includes(s));
  const selectedRows =
    stats &&
    selected.reduce((sum, s) => {
      const key = TILE_META[s].statKey;
      return sum + (stats[key] ?? 0);
    }, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">هسته محتوا</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            داده‌های اصلی WibeCur — حداقل یکی را انتخاب کنید
          </p>
        </div>
        <button
          type="button"
          onClick={onSelectAll}
          className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
        >
          {allSelected ? 'همه انتخاب شده' : 'انتخاب هر سه'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CONTENT_SCOPES.map((scope) => {
          const meta = TILE_META[scope];
          const Icon = meta.icon;
          const isOn = selected.includes(scope);
          const count = stats ? stats[meta.statKey] : null;

          return (
            <button
              key={scope}
              type="button"
              onClick={() => onToggle(scope)}
              className={clsx(
                'relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-right transition-all',
                isOn
                  ? 'border-violet-400 bg-gradient-to-br from-violet-50 to-white shadow-md shadow-violet-500/10 dark:from-violet-900/30 dark:to-gray-800/80 dark:border-violet-500'
                  : 'border-gray-200 bg-white hover:border-violet-200 dark:border-gray-600 dark:bg-gray-800/40'
              )}
            >
              {isOn && (
                <CheckCircle2 className="absolute top-3 left-3 h-4 w-4 text-violet-600 dark:text-violet-400" />
              )}
              <div
                className={clsx(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  isOn
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="w-full">
                <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                  {meta.label}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">{meta.sub}</span>
              </div>
              <div className="w-full pt-1 border-t border-gray-100 dark:border-gray-700/80">
                {statsLoading ? (
                  <span className="text-xs text-gray-400">در حال شمارش…</span>
                ) : (
                  <span className="text-lg font-bold tabular-nums text-violet-700 dark:text-violet-300">
                    {count != null ? count.toLocaleString('fa-IR') : '—'}
                    <span className="text-[11px] font-normal text-gray-500 mr-1">رکورد</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && stats && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          جمع انتخاب‌شده هسته محتوا:{' '}
          <strong className="text-violet-700 dark:text-violet-300">
            {(selectedRows ?? 0).toLocaleString('fa-IR')}
          </strong>{' '}
          رکورد
        </p>
      )}
    </div>
  );
}
