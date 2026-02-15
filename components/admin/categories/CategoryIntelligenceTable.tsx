'use client';

import { Pencil, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import type { CategoryIntelligenceRow } from '@/lib/admin/categories-types';

interface CategoryIntelligenceTableProps {
  categories: CategoryIntelligenceRow[];
}

export default function CategoryIntelligenceTable({ categories }: CategoryIntelligenceTableProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-[var(--color-bg)] sticky top-0 z-10">
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                دسته‌بندی
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                لیست‌ها
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                رشد ذخیره
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                تعامل
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                وزن
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                وضعیت
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)] w-24">
                اکشن
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-muted)]">
            {categories.map((cat) => (
              <tr
                key={cat.id}
                className="hover:bg-[var(--color-bg)] transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{
                        backgroundColor: cat.color ? `${cat.color}20` : 'var(--color-bg)',
                        color: cat.color || 'var(--color-text-muted)',
                      }}
                    >
                      {cat.icon || '📁'}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-text)]">{cat.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)] font-mono">{cat.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm tabular-nums">
                  {cat.listCount.toLocaleString('fa-IR')}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-sm font-medium tabular-nums ${
                      cat.saveGrowthPercent > 0
                        ? 'text-emerald-600'
                        : cat.saveGrowthPercent < 0
                          ? 'text-red-600'
                          : 'text-[var(--color-text-muted)]'
                    }`}
                  >
                    {cat.saveGrowthPercent >= 0 ? '+' : ''}
                    {cat.saveGrowthPercent.toLocaleString('fa-IR')}٪
                  </span>
                </td>
                <td className="px-4 py-3 text-sm tabular-nums">
                  {cat.engagementRatio.toFixed(1)}٪
                </td>
                <td className="px-4 py-3 text-sm tabular-nums">
                  {cat.weight ?? cat.order}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${
                      cat.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {cat.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/categories/${cat.id}/edit`}
                      className="p-2 rounded-lg hover:bg-[var(--color-bg)] text-[var(--primary)]"
                      title="ویرایش"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/analytics?category=${cat.id}`}
                      className="p-2 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)]"
                      title="آنالیتیکس"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {categories.length === 0 && (
        <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
          دسته‌ای یافت نشد.
        </div>
      )}
    </div>
  );
}
