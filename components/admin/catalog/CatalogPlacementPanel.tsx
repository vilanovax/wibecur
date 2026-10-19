'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, PlusCircle } from 'lucide-react';
import CatalogItemPicker from '@/components/admin/items/CatalogItemPicker';

type ListOption = { id: string; title: string; icon?: string | null };

interface CatalogPlacementPanelProps {
  listId: string;
  listTitle?: string;
  listIcon?: string | null;
  categorySlug?: string | null;
  lists?: ListOption[];
  workspaceHref?: string;
  onListChange?: (listId: string) => void;
}

export default function CatalogPlacementPanel({
  listId,
  listTitle,
  listIcon,
  categorySlug,
  lists = [],
  workspaceHref,
  onListChange,
}: CatalogPlacementPanelProps) {
  const router = useRouter();
  const showListSelector = !listId && lists.length > 0;

  const createHref = listId
    ? `/admin/lists?view=catalog&mode=create&listId=${listId}`
    : '/admin/lists?view=catalog&mode=create';

  return (
    <section className="mb-6 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-l from-emerald-50/90 to-white px-4 py-3.5">
        <div className="min-w-0">
          {workspaceHref && (
            <Link
              href={workspaceHref}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800/80 hover:text-emerald-900 mb-1"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              بازگشت به workspace
            </Link>
          )}
          <h2 className="text-base font-bold text-[var(--color-text)]">
            {listTitle ? (
              <>
                افزودن به «{listIcon || '📋'} {listTitle}»
              </>
            ) : (
              'افزودن از کاتالوگ به لیست'
            )}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            جستجو کنید و با یک کلیک به لیست وصل کنید — بدون کپی محتوا
          </p>
        </div>
        <Link
          href={createHref}
          className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50"
        >
          <PlusCircle className="w-4 h-4" />
          موجودیت جدید
        </Link>
      </div>

      <CatalogItemPicker
        listId={listId || lists[0]?.id || ''}
        categorySlug={categorySlug}
        showListSelector={showListSelector}
        lists={lists}
        onListChange={onListChange}
        onAdded={() => {
          router.refresh();
          if (workspaceHref) {
            // optional: stay on catalog for batch adds
          }
        }}
      />
    </section>
  );
}
