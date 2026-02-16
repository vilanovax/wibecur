'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ListsIntelligenceData, ListIntelligenceRow } from '@/lib/admin/lists-intelligence';
import ListPulseSummary from '@/components/admin/lists/ListPulseSummary';
import ListSmartFilterBar, { type ListFilterKind } from '@/components/admin/lists/ListSmartFilterBar';
import ListIntelligenceCard from '@/components/admin/lists/ListIntelligenceCard';
import ListIntelligenceTable from '@/components/admin/lists/ListIntelligenceTable';
import MoveToTrashModal from '@/components/admin/lists/MoveToTrashModal';

type SortKey =
  | 'score_desc'
  | 'score_asc'
  | 'saves_desc'
  | 'saves_asc'
  | '24h_desc'
  | 'date_desc'
  | 'date_asc';

function filterLists(lists: ListIntelligenceRow[], filter: ListFilterKind): ListIntelligenceRow[] {
  switch (filter) {
    case 'all':
      return lists;
    case 'rising':
      return lists.filter((l) => l.status === 'rising');
    case 'trending_top':
      return lists.filter((l) => l.rank <= 10);
    case 'low_engagement':
      return lists.filter((l) => l.lowEngagement);
    case 'suspicious':
      return lists.filter((l) => l.riskLevel === 'medium' || l.riskLevel === 'high');
    case 'needs_review':
      return lists.filter((l) => l.needsReview);
    case 'zero_save':
      return lists.filter((l) => l.saveCount === 0);
    default:
      return lists;
  }
}

function sortLists(lists: ListIntelligenceRow[], sortBy: SortKey): ListIntelligenceRow[] {
  const arr = [...lists];
  switch (sortBy) {
    case 'score_desc':
      return arr.sort((a, b) => b.trendingScore - a.trendingScore);
    case 'score_asc':
      return arr.sort((a, b) => a.trendingScore - b.trendingScore);
    case 'saves_desc':
      return arr.sort((a, b) => b.saveCount - a.saveCount);
    case 'saves_asc':
      return arr.sort((a, b) => a.saveCount - b.saveCount);
    case '24h_desc':
      return arr.sort((a, b) => b.saves24h - a.saves24h);
    case 'date_desc':
      return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'date_asc':
      return arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    default:
      return arr;
  }
}

export default function ListsIntelligenceClient({
  data,
  trash: isTrashView,
}: {
  data: ListsIntelligenceData;
  trash: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<ListFilterKind>('all');
  const [sortBy, setSortBy] = useState<SortKey>('score_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [lists, setLists] = useState<ListIntelligenceRow[]>(data.lists);
  const [moveToTrashRow, setMoveToTrashRow] = useState<ListIntelligenceRow | null>(null);

  const handleMoveToTrash = async (id: string, reason?: string) => {
    const res = await fetch(`/api/admin/lists/${id}/trash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || null }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'خطا');
    setLists((prev) => prev.filter((l) => l.id !== id));
    setMoveToTrashRow(null);
    router.refresh();
    // می‌توان با toast جایگزین کرد
    if (typeof window !== 'undefined') window.alert('به زباله‌دان منتقل شد.');
  };

  const handleRestore = async (id: string) => {
    const res = await fetch(`/api/admin/lists/${id}/restore`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'خطا');
    setLists((prev) => prev.filter((l) => l.id !== id));
    router.refresh();
  };

  const filtered = useMemo(
    () => filterLists(lists, filter),
    [lists, filter]
  );
  const sorted = useMemo(
    () => sortLists(filtered, sortBy),
    [filtered, sortBy]
  );

  const handleFeatureToggle = (id: string, isFeatured: boolean) => {
    setLists((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isFeatured } : l))
    );
  };

  const handleDisableToggle = (id: string, isActive: boolean) => {
    setLists((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isActive } : l))
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            هوش لیست‌ها
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {sorted.length} لیست از {lists.length}
          </p>
        </div>
        {!isTrashView && (
          <Link
            href="/admin/lists/new"
            className="px-5 py-2.5 rounded-2xl font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            + لیست جدید
          </Link>
        )}
      </div>

      <section className="flex gap-2 border-b border-[var(--color-border-muted)] pb-2">
        <Link
          href="/admin/lists"
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            !isTrashView
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
          }`}
        >
          فعال‌ها
        </Link>
        <Link
          href="/admin/lists?trash=true"
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            isTrashView
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
          }`}
        >
          زباله‌دان
        </Link>
      </section>

      {!isTrashView && (
        <section>
          <ListPulseSummary pulse={data.pulse} />
        </section>
      )}
      {isTrashView && data.lists.length > 0 && (
        <p className="text-sm text-[var(--color-text-muted)]">
          {data.lists.length} لیست در زباله‌دان. می‌توانید بازگردانی کنید.
        </p>
      )}

      <section>
        <ListSmartFilterBar
          value={filter}
          onChange={setFilter}
          sortBy={sortBy}
          onSortChange={(v) => setSortBy(v as SortKey)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </section>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sorted.map((row) => (
            <ListIntelligenceCard
              key={row.id}
              row={row}
              isTrashView={isTrashView}
              onFeatureToggle={isTrashView ? undefined : handleFeatureToggle}
              onDisableToggle={isTrashView ? undefined : handleDisableToggle}
              onMoveToTrash={isTrashView ? undefined : () => setMoveToTrashRow(row)}
              onRestore={isTrashView ? handleRestore : undefined}
            />
          ))}
        </div>
      ) : (
        <ListIntelligenceTable
          rows={sorted}
          isTrashView={isTrashView}
          onFeatureToggle={isTrashView ? undefined : handleFeatureToggle}
          onDisableToggle={isTrashView ? undefined : handleDisableToggle}
          onMoveToTrash={isTrashView ? undefined : (row) => setMoveToTrashRow(row)}
          onRestore={isTrashView ? handleRestore : undefined}
        />
      )}

      <MoveToTrashModal
        row={moveToTrashRow}
        open={!!moveToTrashRow}
        onClose={() => setMoveToTrashRow(null)}
        onConfirm={handleMoveToTrash}
      />

      {sorted.length === 0 && (
        <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-muted)] py-12 text-center text-[var(--color-text-muted)]">
          {filter === 'all'
            ? 'لیستی یافت نشد.'
            : 'با این فیلتر لیستی یافت نشد.'}
        </div>
      )}
    </div>
  );
}
