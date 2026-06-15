'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { SuggestionItem } from './SmartSuggestionsTab';

type Props = {
  onPickList: (listId: string) => void;
  defaultOpen?: boolean;
};

export default function SmartSuggestionsPanel({ onPickList, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [items, setItems] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    setLoading(true);
    setError(null);
    fetch('/api/admin/custom/featured/suggestions')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setItems(Array.isArray(data.suggestions) ? data.suggestions.slice(0, 5) : []);
        setLoaded(true);
      })
      .catch(() => setError('خطا در دریافت پیشنهادات'))
      .finally(() => setLoading(false));
  }, [open, loaded]);

  return (
    <div className="rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-900/20 overflow-hidden" dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-50/80"
      >
        <span className="inline-flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          پیشنهاد بر اساس داده
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-amber-200/60 dark:border-amber-800/60">
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600 dark:text-amber-400" />
            </div>
          )}
          {error && <p className="text-sm text-red-600 dark:text-red-400 py-2">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="text-xs text-amber-800 dark:text-amber-300 py-2">پیشنهادی در دسترس نیست.</p>
          )}
          {!loading && items.length > 0 && (
            <ul className="space-y-2 mt-2">
              {items.map((item, i) => (
                <li key={item.listId}>
                  <button
                    type="button"
                    onClick={() => onPickList(item.listId)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/80 border border-transparent hover:border-amber-200 text-right transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="w-12 h-8 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                      <ImageWithFallback
                        src={item.coverImage ?? ''}
                        alt=""
                        className="w-full h-full object-cover"
                        placeholderSize="square"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        امتیاز {item.suggestionScore.toFixed(1)}
                        {item.categoryName ? ` · ${item.categoryName}` : ''}
                      </p>
                    </div>
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
