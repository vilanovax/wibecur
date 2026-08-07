'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { List, Package } from 'lucide-react';
import ListSuggestionsTable from '@/components/admin/suggestions/ListSuggestionsTable';
import ItemSuggestionsTable from '@/components/admin/suggestions/ItemSuggestionsTable';

interface SuggestionsPageClientProps {
  initialTab?: string;
  initialStatus?: string;
  initialPage?: string;
  initialSource?: string;
  itemPendingCount?: number;
}

const tabs = [
  { id: 'items', label: 'آیتم', icon: Package },
  { id: 'lists', label: 'لیست', icon: List },
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

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-xl bg-gray-100 dark:bg-gray-700/50 p-1 scrollbar-hide">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              active
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
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

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm" dir="rtl">
      <div className="space-y-3 border-b border-gray-100 dark:border-gray-700 px-4 py-4 md:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex self-start rounded-xl bg-gray-100 dark:bg-gray-700/50 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    active
                      ? 'bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-300 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <SegmentedControl
            value={status}
            options={statusFilters}
            onChange={(id) => {
              setStatus(id);
              setPage('1');
            }}
          />
        </div>

        {activeTab === 'items' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">منبع:</span>
            <SegmentedControl
              value={source}
              options={sourceFilters}
              onChange={(id) => {
                setSource(id);
                setPage('1');
              }}
            />
          </div>
        )}
      </div>

      <div className="px-4 py-4 md:px-5 md:py-5">
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
    </div>
  );
}
