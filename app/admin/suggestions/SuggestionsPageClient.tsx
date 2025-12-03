'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { List, Package } from 'lucide-react';
import ListSuggestionsTable from '@/components/admin/suggestions/ListSuggestionsTable';
import ItemSuggestionsTable from '@/components/admin/suggestions/ItemSuggestionsTable';

interface SuggestionsPageClientProps {
  initialTab?: string;
  initialStatus?: string;
  initialPage?: string;
}

export default function SuggestionsPageClient({
  initialTab = 'lists',
  initialStatus = 'pending',
  initialPage = '1',
}: SuggestionsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    // Update URL when tab/status/page changes
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', activeTab);
    params.set('status', status);
    params.set('page', page);
    router.push(`/admin/suggestions?${params.toString()}`);
  }, [activeTab, status, page, router, searchParams]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab('lists');
              setPage('1');
            }}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'lists'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <List className="w-5 h-5" />
              <span>پیشنهادات لیست</span>
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('items');
              setPage('1');
            }}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'items'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Package className="w-5 h-5" />
              <span>پیشنهادات آیتم</span>
            </div>
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setStatus('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              در انتظار ({status === 'pending' ? '...' : ''})
            </button>
            <button
              onClick={() => setStatus('approved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                status === 'approved'
                  ? 'bg-green-100 text-green-800 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              تایید شده
            </button>
            <button
              onClick={() => setStatus('rejected')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                status === 'rejected'
                  ? 'bg-red-100 text-red-800 border-2 border-red-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              رد شده
            </button>
            <button
              onClick={() => setStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                status === 'all'
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              همه
            </button>
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

