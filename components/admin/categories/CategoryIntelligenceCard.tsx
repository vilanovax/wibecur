'use client';

import {
  Pencil,
  Scale,
  BarChart3,
  Zap,
  Power,
  ArrowUp,
  ArrowDown,
  Minus,
  List,
} from 'lucide-react';
import Link from 'next/link';
import type { CategoryIntelligenceRow } from '@/lib/admin/categories-types';

interface CategoryIntelligenceCardProps {
  category: CategoryIntelligenceRow;
}

export default function CategoryIntelligenceCard({ category }: CategoryIntelligenceCardProps) {
  const growthUp = category.saveGrowthPercent > 0;
  const growthDown = category.saveGrowthPercent < 0;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-muted)] flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl font-semibold"
            style={{
              backgroundColor: category.color ? `${category.color}18` : 'var(--color-bg)',
              color: category.color || 'var(--color-text-muted)',
            }}
          >
            {category.icon || '📁'}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--color-text)] truncate">
              {category.name}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] font-mono truncate">
              {category.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-medium ${
              category.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-[var(--color-text-muted)]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${category.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {category.isActive ? 'فعال' : 'غیرفعال'}
          </span>
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-medium tabular-nums ${
              growthUp ? 'bg-emerald-100 text-emerald-700' : growthDown ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-[var(--color-text-muted)]'
            }`}
          >
            {growthUp && <ArrowUp className="w-3 h-3" />}
            {growthDown && <ArrowDown className="w-3 h-3" />}
            {!growthUp && !growthDown && <Minus className="w-3 h-3" />}
            {category.saveGrowthPercent > 0 ? '+' : ''}
            {category.saveGrowthPercent.toLocaleString('fa-IR')}٪
          </span>
        </div>
      </div>

      {/* Body – metrics */}
      <div className="p-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-muted)] flex items-center gap-1.5">
            <List className="w-4 h-4" />
            لیست‌ها
          </span>
          <span className="font-medium tabular-nums">{category.listCount.toLocaleString('fa-IR')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-muted)]">آیتم‌های یکتا</span>
          <span className="font-medium tabular-nums">{category.uniqueItemCount.toLocaleString('fa-IR')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-muted)]">رشد ذخیره ۷ روز</span>
          <span className={`tabular-nums font-medium ${growthUp ? 'text-emerald-600' : growthDown ? 'text-red-600' : ''}`}>
            {category.saveGrowthPercent >= 0 ? '+' : ''}{category.saveGrowthPercent.toLocaleString('fa-IR')}٪
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-muted)]">نسبت تعامل</span>
          <span className="font-medium tabular-nums">{category.engagementRatio.toFixed(1)}٪</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-muted)]">لیست‌های فعال ٪</span>
          <span className="font-medium tabular-nums">{category.activeListsPercent.toFixed(0)}٪</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-muted)]">میانگین امتیاز ترند</span>
          <span className="font-medium tabular-nums">{category.avgSavesPerList.toLocaleString('fa-IR')}</span>
        </div>
      </div>

      {/* Control Zone */}
      <div className="p-4 pt-0 flex flex-wrap gap-2 border-t border-[var(--color-border-muted)]">
        <Link
          href={`/admin/categories/${category.id}/edit`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
        >
          <Pencil className="w-4 h-4" />
          ویرایش
        </Link>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] transition-colors"
        >
          <Scale className="w-4 h-4" />
          تنظیم وزن
        </button>
        <Link
          href={`/admin/analytics?category=${category.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          آنالیتیکس
        </Link>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Boost
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <Power className="w-4 h-4" />
          غیرفعال
        </button>
      </div>
    </div>
  );
}
