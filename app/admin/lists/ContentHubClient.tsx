'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { List, Library, FileJson, Plus, UserRound, AlignLeft, Lightbulb, ImageIcon } from 'lucide-react';
import type { ContentHubStats } from '@/lib/admin/content-hub-stats';
import type { ListsIntelligenceData } from '@/lib/admin/lists-types';
import type { CatalogPageData } from '@/lib/admin/catalog-page-data';
import ContentHubStatsBar from '@/components/admin/lists/ContentHubStatsBar';
import ContentHubToolsMenu from '@/components/admin/lists/ContentHubToolsMenu';
import type { NewItemFormList } from '../items/new/NewItemForm';
import type { ListDescriptionsPageData } from '@/lib/admin/list-description-import';
import type { ItemTipsPageData } from '@/lib/admin/item-tip-import';
import type { ListFilterKind } from '@/components/admin/lists/ListSmartFilterBar';

function ViewFallback() {
  return (
    <div
      className="py-16 text-center text-sm text-[var(--color-text-muted)] animate-pulse"
      dir="rtl"
    >
      در حال بارگذاری…
    </div>
  );
}

const ListsIntelligenceClient = dynamic(() => import('./ListsIntelligenceClient'), {
  loading: () => <ViewFallback />,
});
const CatalogPageClient = dynamic(() => import('../catalog/CatalogPageClient'), {
  loading: () => <ViewFallback />,
});
const BulkImportClient = dynamic(() => import('../items/import/BulkImportClient'), {
  loading: () => <ViewFallback />,
});
const PeoplePageClient = dynamic(
  () => import('@/components/admin/people/PeoplePageClient'),
  { loading: () => <ViewFallback /> }
);
const ListDescriptionsClient = dynamic(
  () => import('@/components/admin/lists/ListDescriptionsClient'),
  { loading: () => <ViewFallback /> }
);
const ItemTipsClient = dynamic(
  () => import('@/components/admin/lists/ItemTipsClient'),
  { loading: () => <ViewFallback /> }
);

export type ContentHubView = 'lists' | 'catalog' | 'import' | 'people' | 'descriptions' | 'item-tips';

type ImportListOption = {
  id: string;
  title: string;
  slug: string;
  categoryId: string | null;
  itemCount: number;
  createdAt: string;
  categories: { id: string; name: string; slug: string; icon: string | null } | null;
};

type ImportCategoryOption = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  isActive?: boolean;
};

interface ContentHubClientProps {
  view: ContentHubView;
  hubStats: ContentHubStats;
  listsData?: ListsIntelligenceData;
  trash?: boolean;
  initialCategoryId?: string;
  initialSearch?: string;
  initialFilter?: ListFilterKind;
  catalogData?: CatalogPageData;
  importCategories?: ImportCategoryOption[];
  importLists?: ImportListOption[];
  initialImportListId?: string;
  initialImportCategoryId?: string;
  createLists?: NewItemFormList[];
  initialCreateListId?: string;
  catalogMode?: string;
  descriptionsData?: ListDescriptionsPageData;
  itemTipsData?: ItemTipsPageData;
}

const STATS_COLLAPSED_KEY = 'admin-content-hub-stats-collapsed';

function tabClass(active: boolean) {
  return `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
    active
      ? 'bg-white text-violet-700 shadow-sm'
      : 'text-gray-600 hover:text-gray-900'
  }`;
}

export default function ContentHubClient({
  view,
  hubStats,
  listsData,
  trash = false,
  initialCategoryId = 'all',
  initialSearch = '',
  initialFilter = 'all',
  catalogData,
  importCategories = [],
  importLists = [],
  initialImportListId,
  initialImportCategoryId,
  createLists,
  initialCreateListId,
  catalogMode,
  descriptionsData,
  itemTipsData,
}: ContentHubClientProps) {
  const router = useRouter();
  const [statsCollapsed, setStatsCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STATS_COLLAPSED_KEY);
    if (stored === '0') setStatsCollapsed(false);
  }, []);

  useEffect(() => {
    localStorage.setItem(STATS_COLLAPSED_KEY, statsCollapsed ? '1' : '0');
  }, [statsCollapsed]);

  const switchView = (next: ContentHubView) => {
    if (next === view) return;
    const params = new URLSearchParams();
    if (next !== 'lists') params.set('view', next);
    const qs = params.toString();
    router.push(qs ? `/admin/lists?${qs}` : '/admin/lists');
  };

  const showHubTools = view !== 'import' && view !== 'people' && !trash;
  const primaryAction =
    view === 'lists' ? (
      <Link
        href="/admin/lists/new"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        <Plus className="w-4 h-4" />
        لیست جدید
      </Link>
    ) : view === 'catalog' && catalogMode !== 'create' ? (
      <Link
        href="/admin/lists?view=catalog&mode=create"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        آیتم جدید
      </Link>
    ) : null;

  return (
    <div className="space-y-4" dir="rtl">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-[var(--color-text)]">لیست‌ها و محتوا</h1>
        {showHubTools && (
          <div className="flex flex-wrap items-center gap-2">
            {view === 'catalog' && catalogMode !== 'create' && (
              <Link
                href="/admin/catalog/storage-images"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                title="جستجوی Google و آپلود تصویر روی ParsPack"
              >
                <ImageIcon className="w-4 h-4" />
                تصاویر
              </Link>
            )}
            {primaryAction}
            <ContentHubToolsMenu showNewList={view !== 'lists'} />
          </div>
        )}
      </header>

      {view !== 'import' && view !== 'people' && (
        <ContentHubStatsBar
          stats={hubStats}
          view={view}
          collapsed={statsCollapsed}
          onToggleCollapse={() => setStatsCollapsed((c) => !c)}
        />
      )}

      {/* تب‌ها */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200/80 w-fit max-w-full overflow-x-auto">
        <button type="button" onClick={() => switchView('lists')} className={tabClass(view === 'lists')}>
          <List className="w-4 h-4" />
          لیست‌ها
        </button>
        <button type="button" onClick={() => switchView('catalog')} className={tabClass(view === 'catalog')}>
          <Library className="w-4 h-4" />
          کاتالوگ
        </button>
        <button type="button" onClick={() => switchView('people')} className={tabClass(view === 'people')}>
          <UserRound className="w-4 h-4" />
          اشخاص
        </button>
        <button
          type="button"
          onClick={() => switchView('descriptions')}
          className={tabClass(view === 'descriptions')}
        >
          <AlignLeft className="w-4 h-4" />
          توضیحات
        </button>
        <button
          type="button"
          onClick={() => switchView('item-tips')}
          className={tabClass(view === 'item-tips')}
        >
          <Lightbulb className="w-4 h-4" />
          tip
        </button>
        <button type="button" onClick={() => switchView('import')} className={tabClass(view === 'import')}>
          <FileJson className="w-4 h-4" />
          import
        </button>
      </div>

      {/* محتوا */}
      {view === 'lists' && listsData && (
        <ListsIntelligenceClient
          data={listsData}
          trash={trash}
          initialCategoryId={initialCategoryId}
          initialSearch={initialSearch}
          initialFilter={initialFilter}
          embedded
        />
      )}

      {view === 'catalog' && catalogData && (
        <CatalogPageClient
          {...catalogData}
          embedded
          basePath="/admin/lists"
          viewParam="catalog"
          createLists={createLists}
          initialCreateListId={initialCreateListId}
        />
      )}

      {view === 'import' && (
        <BulkImportClient
          categories={importCategories}
          lists={importLists}
          initialListId={initialImportListId}
          initialCategoryId={initialImportCategoryId}
          embedded
        />
      )}

      {view === 'people' && <PeoplePageClient embedded />}

      {view === 'descriptions' && descriptionsData && (
        <ListDescriptionsClient data={descriptionsData} embedded />
      )}

      {view === 'item-tips' && itemTipsData && (
        <ItemTipsClient data={itemTipsData} embedded />
      )}
    </div>
  );
}
