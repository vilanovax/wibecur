'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { List, Package, Clock, CheckCircle2, XCircle, Filter } from 'lucide-react';
import ListSuggestionsTable from '@/components/admin/suggestions/ListSuggestionsTable';
import ItemSuggestionsTable from '@/components/admin/suggestions/ItemSuggestionsTable';

interface SuggestionsPageClientProps {
  initialTab?: string;
  initialStatus?: string;
  initialPage?: string;
}

const tabs = [
  { id: 'lists', label: 'پیشنهادات لیست', icon: List },
  { id: 'items', label: 'پیشنهادات آیتم', icon: Package },
];

const statusFilters = [
  { id: 'pending', label: 'در انتظار', icon: Clock, color: 'yellow' },
  { id: 'approved', label: 'تایید شده', icon: CheckCircle2, color: 'green' },
  { id: 'rejected', label: 'رد شده', icon: XCircle, color: 'red' },
  { id: 'all', label: 'همه', icon: Filter, color: 'blue' },
];

export default function SuggestionsPageClient({
  initialTab = 'lists',
  initialStatus = 'pending',
  initialPage = '1',
}: SuggestionsPageClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(initialPage);
  const isInitialMount = useRef(true);

  // Only update URL when user changes tab, status, or page (not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const params = new URLSearchParams();
    params.set('tab', activeTab);
    params.set('status', status);
    params.set('page', page);
    router.replace(`/admin/suggestions?${params.toString()}`, { scroll: false });
  }, [activeTab, status, page, router]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setPage('1');
  };

  const handleStatusChange = (statusId: string) => {
    setStatus(statusId);
    setPage('1');
  };

  return (
    <div className="space-y-6">
      {/* Modern Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 relative px-6 py-5 text-center font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-primary bg-primary/5'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                  <span className="text-base">{tab.label}</span>
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Status Filters */}
        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 ml-2">فیلتر وضعیت:</span>
            {statusFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = status === filter.id;
              const colorClasses = {
                yellow: isActive ? 'bg-yellow-100 text-yellow-800 border-yellow-200 shadow-yellow-100' : '',
                green: isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-emerald-100' : '',
                red: isActive ? 'bg-red-100 text-red-800 border-red-200 shadow-red-100' : '',
                blue: isActive ? 'bg-blue-100 text-blue-800 border-blue-200 shadow-blue-100' : '',
              };

              return (
                <button
                  key={filter.id}
                  onClick={() => handleStatusChange(filter.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    isActive
                      ? `${colorClasses[filter.color as keyof typeof colorClasses]} shadow-sm`
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'lists' ? (
            <ListSuggestionsTable
              status={status === 'all' ? undefined : status}
              currentPage={parseInt(page, 10) || 1}
              onPageChange={(newPage) => setPage(newPage.toString())}
            />
          ) : (
            <ItemSuggestionsTable
              status={status === 'all' ? undefined : status}
              currentPage={parseInt(page, 10) || 1}
              onPageChange={(newPage) => setPage(newPage.toString())}
            />
          )}
        </div>
      </div>
    </div>
  );
}
