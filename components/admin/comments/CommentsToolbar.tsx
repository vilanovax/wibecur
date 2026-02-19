'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Filter,
  CheckCircle,
  AlertTriangle,
  Flag,
  Clock,
  XCircle,
  Search,
  RefreshCw,
} from 'lucide-react';

const FILTERS = [
  { id: 'all', label: 'همه', icon: Filter },
  { id: 'pending', label: 'در انتظار بررسی', icon: Clock },
  { id: 'approved', label: 'تایید شده', icon: CheckCircle },
  { id: 'flagged', label: 'Flagged', icon: Flag },
  { id: 'filtered', label: 'کلمات بد', icon: AlertTriangle },
  { id: 'reported', label: 'ریپورت شده', icon: Flag },
  { id: 'rejected', label: 'رد شده', icon: XCircle },
] as const;

interface CommentsToolbarProps {
  currentFilter: string;
  currentSearch: string;
  totalCount: number;
  onFilterChange: (filter: string) => void;
  onSearchSubmit: (search: string) => void;
  onRefresh: () => void;
}

export default function CommentsToolbar({
  currentFilter,
  currentSearch,
  totalCount,
  onFilterChange,
  onSearchSubmit,
  onRefresh,
}: CommentsToolbarProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);
      if (searchTimeout) clearTimeout(searchTimeout);
      const t = setTimeout(() => {
        const params = new URLSearchParams();
        if (currentFilter !== 'all') params.set('filter', currentFilter);
        if (value) params.set('search', value);
        router.push(`/admin/comments?${params.toString()}`);
      }, 300);
      setSearchTimeout(t);
    },
    [currentFilter, router, searchTimeout]
  );

  const handleFilterChange = (filter: string) => {
    onFilterChange(filter);
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('filter', filter);
    if (currentSearch) params.set('search', currentSearch);
    router.push(`/admin/comments?${params.toString()}`);
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4"
      style={{ direction: 'rtl' }}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <form
          className="flex-1 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const params = new URLSearchParams();
            if (currentFilter !== 'all') params.set('filter', currentFilter);
            if (searchInput) params.set('search', searchInput);
            router.push(`/admin/comments?${params.toString()}`);
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="جستجو در کامنت‌ها..."
              className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
        </form>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-slate-500 whitespace-nowrap">
            نتیجه: {totalCount.toLocaleString('fa-IR')}
          </span>
          <button
            type="button"
            onClick={() => onRefresh()}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            title="بروزرسانی"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap mt-3">
        {FILTERS.map((f) => {
          const Icon = f.icon;
          const active = currentFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => handleFilterChange(f.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
