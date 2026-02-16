'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, Save, BarChart3, Calendar, RefreshCw } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

export type SuggestionItem = {
  listId: string;
  title: string;
  slug: string;
  coverImage: string | null;
  categoryId: string | null;
  categoryName: string | null;
  suggestionScore: number;
  trendingScore: number;
  saveVelocity: number;
  S7: number;
  categoryImpactScore: number;
  reasons: string[];
};

export type RotationInsight = {
  categoryStats: { categoryId: string; name: string; countLast4: number; rotationModifier: number }[];
  suggestedCategory: string | null;
  reasoning: string;
};

type Props = {
  onScheduleList: (listId: string) => void;
};

export default function SmartSuggestionsTab({ onScheduleList }: Props) {
  const [items, setItems] = useState<SuggestionItem[]>([]);
  const [rotationInsight, setRotationInsight] = useState<RotationInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/admin/custom/featured/suggestions')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        setItems(Array.isArray(data.suggestions) ? data.suggestions : []);
        setRotationInsight(data.rotationInsight ?? null);
      })
      .catch(() => {
        if (!cancelled) setError('خطا در دریافت پیشنهادات');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12" dir="rtl">
        <p className="text-gray-500">در حال بارگذاری پیشنهادات…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-300" dir="rtl">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6" dir="rtl">
        {rotationInsight && (rotationInsight.categoryStats.length > 0 || rotationInsight.reasoning) && (
          <section className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-900/20 p-4">
            <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200 font-medium mb-3">
              <RefreshCw className="w-5 h-5" />
              بینش چرخش دسته‌ها
            </div>
            {rotationInsight.categoryStats.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2">تعداد Featured در ۴ هفته اخیر:</p>
                <ul className="flex flex-wrap gap-2">
                  {rotationInsight.categoryStats.map((c) => (
                    <li
                      key={c.categoryId}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm ${
                        c.rotationModifier > 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200' : c.rotationModifier < 0 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="font-bold">{c.countLast4}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {rotationInsight.suggestedCategory && (
              <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-2">
                پیشنهاد دسته این هفته: <strong>{rotationInsight.suggestedCategory}</strong>
              </p>
            )}
            <p className="text-sm text-indigo-800 dark:text-indigo-200">{rotationInsight.reasoning}</p>
          </section>
        )}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
          <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-60" />
          <p>در حال حاضر لیست واجد شرایطی برای پیشنهاد نیست.</p>
          <p className="text-sm mt-2">لیست‌هایی که اخیراً Featured شده‌اند یا الان زمان‌بندی دارند از پیشنهاد حذف می‌شوند.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-semibold">پیشنهاد هوشمند Featured</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        بر اساس امتیاز ترندینگ، رشد ذخیره، عملکرد دسته و مدت Featured نشدن.
      </p>

      {rotationInsight && (rotationInsight.categoryStats.length > 0 || rotationInsight.reasoning) && (
        <section className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-900/20 p-4">
          <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200 font-medium mb-3">
            <RefreshCw className="w-5 h-5" />
            بینش چرخش دسته‌ها
          </div>
          {rotationInsight.categoryStats.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2">تعداد Featured در ۴ هفته اخیر:</p>
              <ul className="flex flex-wrap gap-2">
                {rotationInsight.categoryStats.map((c) => (
                  <li
                    key={c.categoryId}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm ${
                      c.rotationModifier > 0
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
                        : c.rotationModifier < 0
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="font-bold">{c.countLast4}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {rotationInsight.suggestedCategory && (
            <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-2">
              پیشنهاد دسته این هفته: <strong>{rotationInsight.suggestedCategory}</strong>
            </p>
          )}
          <p className="text-sm text-indigo-800 dark:text-indigo-200">
            {rotationInsight.reasoning}
          </p>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={item.listId}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm flex flex-col"
          >
            <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-700 relative">
              <ImageWithFallback
                src={item.coverImage ?? ''}
                alt={item.title}
                className="object-cover w-full h-full"
                placeholderSize="cover"
              />
              <span className="absolute top-2 right-2 rounded-lg bg-black/60 text-white text-xs font-bold px-2 py-0.5">
                #{index + 1}
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                {item.title}
              </h3>
              {item.categoryName && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {item.categoryName}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mb-3 text-xs">
                <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 px-2 py-0.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  امتیاز: {item.suggestionScore.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  ترند: {item.trendingScore.toFixed(0)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5">
                  <Save className="w-3.5 h-3.5" />
                  S7: {item.S7}
                </span>
              </div>
              <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-0.5 mb-4 flex-1">
                {item.reasons.slice(0, 4).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onScheduleList(item.listId)}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:from-indigo-700 hover:to-violet-700 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                زمان‌بندی این لیست
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
