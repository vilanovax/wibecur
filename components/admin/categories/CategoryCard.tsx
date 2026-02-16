'use client';

import Link from 'next/link';
import type { CategoryIntelligenceRow } from '@/lib/admin/categories-types';
import CategoryBadges from './CategoryBadges';
import EngagementBar from './EngagementBar';
import CategoryActions from './CategoryActions';

interface CategoryCardProps {
  category: CategoryIntelligenceRow;
}

function getBadges(category: CategoryIntelligenceRow) {
  const engagement = category.engagementRatio;
  const growth = category.saveGrowthPercent;
  const isMonetizable = category.listCount >= 2 || category.engagementRatio >= 2;
  return {
    isFastRising: growth > 10 || category.trendingScoreAvg >= 50,
    isLowEngagement: engagement < 10,
    isMonetizable,
    isDeclining: growth < 0,
  };
}

function getCardBorderClass(category: CategoryIntelligenceRow) {
  const badges = getBadges(category);
  if (!category.isActive) return '';
  if (badges.isDeclining) return 'border-r-4 border-r-red-500 dark:border-r-red-400';
  if (badges.isFastRising) return 'ring-1 ring-emerald-400/50 dark:ring-emerald-500/40';
  return '';
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const badges = getBadges(category);
  const borderClass = getCardBorderClass(category);

  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm overflow-hidden transition-shadow hover:shadow-md p-6 ${borderClass} ${
        !category.isActive ? 'opacity-60' : ''
      }`}
      dir="rtl"
    >
      {/* A) Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg"
            style={{
              backgroundColor: category.color ? `${category.color}20` : 'var(--color-bg)',
              color: category.color || undefined,
            }}
          >
            {category.icon || '📁'}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{category.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">{category.slug}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium shrink-0 ${
            category.isActive
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${category.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {category.isActive ? 'فعال' : 'غیرفعال'}
        </span>
      </div>

      {/* B) Intelligence Badges */}
      <div className="mb-4">
        <CategoryBadges {...badges} />
      </div>

      {/* C) Core Metrics + Engagement Bar */}
      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">لیست‌ها</p>
          <p className="font-semibold text-gray-900 dark:text-white tabular-nums">{category.listCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">تعامل</p>
          <p className="font-semibold text-gray-900 dark:text-white tabular-nums">{category.engagementRatio.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Trend Score</p>
          <p className="font-semibold text-gray-900 dark:text-white tabular-nums">{Math.round(category.trendingScoreAvg)}</p>
        </div>
      </div>
      <div className="mb-4">
        <EngagementBar percentage={category.engagementRatio} />
      </div>

      {/* D) Action Area */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
        <CategoryActions categoryId={category.id} categoryName={category.name} />
      </div>
    </div>
  );
}
