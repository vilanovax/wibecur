'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { List, Package } from 'lucide-react';
import { faNumber } from '@/lib/utils';
import ListSuggestionsTable from '@/components/admin/suggestions/ListSuggestionsTable';
import ItemSuggestionsTable from '@/components/admin/suggestions/ItemSuggestionsTable';

interface SuggestionsPageClientProps {
  initialTab?: string;
  initialStatus?: string;
  initialPage?: string;
  initialSource?: string;
  itemPendingCount?: number;
  listPendingCount?: number;
}

const tabs = [
  { id: 'items', label: 'آیتم', icon: Package, pendingKey: 'item' as const },
  { id: 'lists', label: 'لیست', icon: List, pendingKey: 'list' as const },
];

const statusFilters = [
  { id: 'pending', label: 'در انتظار' },
  { id: 'approved', label: 'تأیید شده' },
  { id: 'rejected', label: 'رد شده' },
  { id: 'all', label: 'همه' },
];

const sourceFilters = [
  { id: 'all', label: 'همه' },
  { id: 'menu', label: 'منوی کاربر' },
  { id: 'form', label: 'فرم کامل' },
];

function PillGroup<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex max-w-full flex-wrap gap-2"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors ${
              active
                ? 'bg-primary text-white'
                : 'border border-(--color-border) bg-(--color-surface) text-wibe-secondary hover:bg-(--color-bg) hover:text-(--color-text)'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function SuggestionsPageClient({
  initialTab = 'items',
  initialStatus = 'pending',
  initialPage = '1',
  initialSource = 'all',
  itemPendingCount = 0,
  listPendingCount = 0,
}: SuggestionsPageClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab === 'lists' ? 'lists' : 'items');
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(initialPage);
  const [source, setSource] = useState(initialSource);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const params = new URLSearchParams();
    params.set('tab', activeTab);
    params.set('status', status);
    params.set('page', page);
    if (activeTab === 'items' && source !== 'all') {
      params.set('source', source);
    }
    router.replace(`/admin/suggestions?${params.toString()}`, { scroll: false });
  }, [activeTab, status, page, source, router]);

  const switchTab = (tabId: string) => {
    setActiveTab(tabId);
    setPage('1');
    if (tabId === 'lists') {
      setSource('all');
    }
  };

  const resolvedStatus = status === 'all' ? undefined : status;
  const pendingByTab = {
    item: itemPendingCount,
    list: listPendingCount,
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const pending = pendingByTab[tab.pendingKey];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-white'
                    : 'border border-(--color-border) bg-(--color-surface) text-wibe-secondary hover:bg-(--color-bg) hover:text-(--color-text)'
                }`}
              >
                <Icon className="size-4" strokeWidth={active ? 2 : 1.5} />
                {tab.label}
                {pending > 0 && (
                  <span
                    className={`rounded-md px-1.5 text-sm tabular-nums ${
                      active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {faNumber(pending)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <PillGroup
          value={status}
          options={statusFilters}
          onChange={(id) => {
            setStatus(id);
            setPage('1');
          }}
          ariaLabel="وضعیت پیشنهاد"
        />

        {activeTab === 'items' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-wibe-secondary">منبع</span>
            <PillGroup
              value={source}
              options={sourceFilters}
              onChange={(id) => {
                setSource(id);
                setPage('1');
              }}
              ariaLabel="منبع پیشنهاد آیتم"
            />
          </div>
        )}
      </div>

      {activeTab === 'lists' ? (
        <ListSuggestionsTable
          status={resolvedStatus}
          currentPage={parseInt(page, 10) || 1}
          onPageChange={(newPage) => setPage(newPage.toString())}
          onSwitchToItems={() => switchTab('items')}
          itemPendingCount={itemPendingCount}
        />
      ) : (
        <ItemSuggestionsTable
          status={resolvedStatus}
          source={source === 'all' ? undefined : (source as 'form' | 'menu')}
          currentPage={parseInt(page, 10) || 1}
          onPageChange={(newPage) => setPage(newPage.toString())}
        />
      )}
    </div>
  );
}
