'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  ExternalLink,
  FileJson,
  Star,
  Eye,
  Bookmark,
  Package,
  BarChart3,
  Settings,
} from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListWorkspaceItemsPanel from '@/components/admin/lists/ListWorkspaceItemsPanel';
import type { ListWorkspaceData } from '@/lib/admin/list-workspace-data';

interface ListWorkspaceClientProps {
  data: ListWorkspaceData;
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-3 py-2">
      <Icon className="w-4 h-4 text-[var(--primary)] shrink-0" />
      <div className="text-right leading-tight">
        <p className="text-sm font-bold tabular-nums text-[var(--color-text)]">
          {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
        </p>
        <p className="text-[10px] text-[var(--color-text-muted)]">{label}</p>
      </div>
    </div>
  );
}

export default function ListWorkspaceClient({ data }: ListWorkspaceClientProps) {
  const router = useRouter();
  const { list, items, intelligence } = data;
  const category = list.categories;
  const publicUrl = `/lists/${list.slug}`;
  const score = intelligence?.scoreBreakdown.finalScore;
  const rank = intelligence?.currentRank;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10" dir="rtl">
      <Link
        href="/admin/lists"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--primary)]"
      >
        <ArrowRight className="w-4 h-4" />
        بازگشت به لیست‌ها
      </Link>

      {/* هدر لیست */}
      <header className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-card)]">
        <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
          <div className="relative h-24 w-20 sm:h-28 sm:w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border-muted)] bg-gray-100">
            <ImageWithFallback
              src={list.coverImage || list.horizontalImage || ''}
              alt=""
              className="h-full w-full object-cover"
              listSlug={list.slug}
              listTitle={list.title}
              categorySlug={category?.slug}
              fallbackIcon={category?.icon ?? '📋'}
              fallbackClassName="flex h-full w-full items-center justify-center text-3xl"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {category && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">
                  {category.icon} {category.name}
                </span>
              )}
              {list.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  Featured
                </span>
              )}
              {!list.isActive && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                  غیرفعال
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">{list.title}</h1>
            {list.description && (
              <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-2">{list.description}</p>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 sm:items-end">
            <Link
              href={`/admin/lists/${list.id}/edit`}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border-muted)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-bg)]"
            >
              <Settings className="w-4 h-4" />
              ویرایش لیست
            </Link>
            <Link
              href={publicUrl}
              target="_blank"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border-muted)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-bg)]"
            >
              <ExternalLink className="w-4 h-4" />
              نمایش عمومی
            </Link>
            <Link
              href={`/admin/lists?view=import&listId=${list.id}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              <FileJson className="w-4 h-4" />
              import
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-4 sm:px-5 pb-4 border-t border-[var(--color-border-muted)] pt-3 bg-[var(--color-bg)]/30">
          <StatPill icon={Package} label="آیتم" value={list.itemCount} />
          <StatPill icon={Bookmark} label="ذخیره" value={list.saveCount} />
          <StatPill icon={Eye} label="بازدید" value={list.viewCount} />
          {score != null && (
            <StatPill icon={BarChart3} label={rank ? `رتبه ${rank}` : 'امتیاز'} value={Math.round(score)} />
          )}
          {intelligence && (
            <Link
              href={`/admin/lists/${list.id}/debug`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--color-border-muted)] px-3 py-2 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/30"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              جزئیات الگوریتم
            </Link>
          )}
        </div>
      </header>

      {/* آیتم‌ها */}
      <ListWorkspaceItemsPanel
        listId={list.id}
        listTitle={list.title}
        categorySlug={category?.slug ?? null}
        categoryIcon={category?.icon ?? null}
        initialItems={items}
        onItemsUpdated={() => router.refresh()}
      />

      <p className="text-center text-xs text-[var(--color-text-muted)]">
        ویرایش کاور، slug و تنظیمات از{' '}
        <Link href={`/admin/lists/${list.id}/edit`} className="text-[var(--primary)] font-medium hover:underline">
          صفحه ویرایش لیست
        </Link>
      </p>
    </div>
  );
}
