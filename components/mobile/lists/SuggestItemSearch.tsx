'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Check, ThumbsUp, Plus, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;
const MAX_DESCRIPTION_LENGTH = 160;

export type SearchResultItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  alreadyInList: boolean;
  alreadySuggested: boolean;
  suggestionCommentId: string | null;
};

export type AutoSuggestItem = {
  id: string;
  title: string;
  category: string | null;
  image: string | null;
};

type CreateStep = 'step1' | 'step2' | 'success';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

function getSearchPlaceholder(categorySlug?: string | null): string {
  if (!categorySlug) return 'چی می‌خوای اضافه کنی؟';
  const s = categorySlug.toLowerCase();
  if (s.includes('movie') || s.includes('film') || s.includes('series')) return 'نام فیلم یا سریال…';
  if (s.includes('book')) return 'نام کتاب…';
  if (s.includes('restaurant') || s.includes('cafe')) return 'نام رستوران یا کافه…';
  if (s.includes('travel')) return 'نام مقصد، شهر…';
  return 'چی می‌خوای اضافه کنی؟';
}

function getCategoryEmoji(categorySlug?: string | null): string {
  if (!categorySlug) return '✨';
  const s = categorySlug.toLowerCase();
  if (s.includes('movie') || s.includes('film') || s.includes('series')) return '🎬';
  if (s.includes('book')) return '📚';
  if (s.includes('restaurant') || s.includes('cafe')) return '☕';
  if (s.includes('travel')) return '✈️';
  return '✨';
}

function getTitlePlaceholder(categorySlug?: string | null): string {
  if (!categorySlug) return 'نام آیتم...';
  const s = categorySlug.toLowerCase();
  if (s.includes('movie') || s.includes('film') || s.includes('series')) return 'نام فیلم...';
  if (s.includes('book')) return 'نام کتاب...';
  if (s.includes('restaurant') || s.includes('cafe')) return 'نام رستوران، کافه...';
  if (s.includes('travel')) return 'نام مقصد، شهر...';
  return 'نام آیتم...';
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

// ——— Progress indicator ———
function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`inline-block w-2 h-2 rounded-full transition-colors ${
              i + 1 <= step ? 'bg-primary' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500">مرحله {step} از {total}</span>
    </div>
  );
}

interface SuggestItemSearchProps {
  listId: string;
  categorySlug?: string | null;
  onSuccess: () => void;
  onScrollToComment?: (commentId: string) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export default function SuggestItemSearch({
  listId,
  categorySlug,
  onSuccess,
  onScrollToComment,
  showToast,
}: SuggestItemSearchProps) {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'search' | CreateStep>('search');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [optionalNoteOpen, setOptionalNoteOpen] = useState(false);
  const [optionalNote, setOptionalNote] = useState('');
  const [submitStatusMap, setSubmitStatusMap] = useState<Record<string, 'idle' | 'submitting' | 'success' | 'alreadySuggested'>>({});
  const [alreadySuggestedCommentId, setAlreadySuggestedCommentId] = useState<string | null>(null);
  const [autoSuggestItems, setAutoSuggestItems] = useState<AutoSuggestItem[]>([]);
  const [autoSuggestFetched, setAutoSuggestFetched] = useState(false);
  const [autoSuggestStatusMap, setAutoSuggestStatusMap] = useState<
    Record<string, 'idle' | 'submitting' | 'success' | 'alreadySuggested'>
  >({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    externalUrl: '',
    imageUrl: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const debouncedQuery = useDebounce(query.trim(), DEBOUNCE_MS);
  const showCategorySelector = !categorySlug;

  const searchItems = useCallback(async () => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: debouncedQuery, listId });
      const res = await fetch(`/api/items/search?${params}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setResults(data.data);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
      showToast?.('مشکلی پیش اومد، دوباره امتحان کن ✨', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, listId, showToast]);

  useEffect(() => {
    searchItems();
  }, [searchItems]);

  useEffect(() => {
    if (view !== 'search' || !listId || autoSuggestFetched) return;
    setAutoSuggestFetched(true);
    fetch(`/api/lists/${listId}/auto-suggest`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) setAutoSuggestItems(d.data);
      })
      .catch(() => {});
  }, [view, listId, autoSuggestFetched]);

  const handleAutoSuggestClick = async (item: AutoSuggestItem) => {
    setAutoSuggestStatusMap((p) => ({ ...p, [item.id]: 'submitting' }));
    try {
      const res = await fetch(`/api/lists/${listId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: item.title, type: 'suggestion' }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.alreadySuggested && data.suggestionCommentId && onScrollToComment) {
          setAutoSuggestStatusMap((p) => ({ ...p, [item.id]: 'alreadySuggested' }));
          showToast?.('این مورد قبلاً پیشنهاد شده 👌', 'success');
          onSuccess();
          onScrollToComment(data.suggestionCommentId);
        } else if (!data.alreadySuggested) {
          setAutoSuggestStatusMap((p) => ({ ...p, [item.id]: 'success' }));
          showToast?.('وایب با پیشنهادت بهتر میشه 💜', 'success');
        } else {
          setAutoSuggestStatusMap((p) => ({ ...p, [item.id]: 'alreadySuggested' }));
          showToast?.(data.message || 'این مورد قبلاً پیشنهاد شده 👌', 'success');
        }
      } else {
        setAutoSuggestStatusMap((p) => ({ ...p, [item.id]: 'idle' }));
        showToast?.(data.error || 'چند لحظه بعد دوباره امتحان کن ✨', 'error');
      }
    } catch {
      setAutoSuggestStatusMap((p) => ({ ...p, [item.id]: 'idle' }));
      showToast?.('چند لحظه بعد دوباره امتحان کن ✨', 'error');
    }
  };

  useEffect(() => {
    if (view === 'step1' && showCategorySelector && categories.length === 0) {
      fetch('/api/categories')
        .then((r) => r.json())
        .then((d) => d.success && d.data && setCategories(d.data));
    }
  }, [view, showCategorySelector, categories.length]);

  const handleSuggestToLink = async (item: SearchResultItem, note?: string) => {
    const content = note?.trim() ? `${item.title}\n\n${note.trim()}` : item.title;
    setSubmitStatusMap((p) => ({ ...p, [item.id]: 'submitting' }));
    try {
      const res = await fetch(`/api/lists/${listId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'suggestion' }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.alreadySuggested && data.suggestionCommentId) {
          setSubmitStatusMap((p) => ({ ...p, [item.id]: 'alreadySuggested' }));
          setAlreadySuggestedCommentId(data.suggestionCommentId);
          showToast?.('این مورد قبلاً پیشنهاد شده 👌', 'success');
        } else {
          setSubmitStatusMap((p) => ({ ...p, [item.id]: 'success' }));
          showToast?.('وایب با پیشنهادت بهتر میشه 💜', 'success');
        }
      } else {
        setSubmitStatusMap((p) => ({ ...p, [item.id]: 'idle' }));
        showToast?.(data.error || 'چند لحظه بعد دوباره امتحان کن ✨', 'error');
      }
    } catch {
      setSubmitStatusMap((p) => ({ ...p, [item.id]: 'idle' }));
      showToast?.('چند لحظه بعد دوباره امتحان کن ✨', 'error');
    }
  };

  const handleViewSuggestion = (commentId: string) => {
    setExpandedItemId(null);
    onSuccess();
    onScrollToComment?.(commentId);
  };

  const expandCard = (item: SearchResultItem) => {
    if (item.alreadyInList) return;
    setExpandedItemId((prev) => (prev === item.id ? null : item.id));
    if (expandedItemId !== item.id) {
      setOptionalNoteOpen(false);
      setOptionalNote('');
      setAlreadySuggestedCommentId(null);
    }
  };

  const goToCreate = () => {
    setFormData({ title: '', description: '', categoryId: '', externalUrl: '', imageUrl: '' });
    setView('step1');
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setView('step2');
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setFormSubmitting(true);
    try {
      const res = await fetch('/api/suggestions/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          externalUrl: formData.externalUrl.trim() || undefined,
          imageUrl: formData.imageUrl.trim() || undefined,
          listId,
          metadata: formData.categoryId ? { categoryId: formData.categoryId } : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setView('success');
      } else if (data.alreadySuggested) {
        showToast?.(data.error || 'این مورد قبلاً پیشنهاد شده 👌', 'success');
        if (data.suggestionCommentId && onScrollToComment) {
          onSuccess();
          onScrollToComment(data.suggestionCommentId);
        } else {
          onSuccess();
        }
      } else {
        showToast?.(data.error || 'چند لحظه بعد دوباره امتحان کن ✨', 'error');
      }
    } catch {
      showToast?.('چند لحظه بعد دوباره امتحان کن ✨', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast?.('حجم فایل باید کمتر از ۵ مگابایت باشد', 'error');
      return;
    }
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('purpose', 'cover');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        setFormData((p) => ({ ...p, imageUrl: data.url }));
      } else {
        showToast?.(data.error || 'آپلود تصویر ناموفق بود', 'error');
      }
    } catch {
      showToast?.('آپلود تصویر ناموفق بود', 'error');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSuccessClose = () => {
    onSuccess();
  };

  // ——— Success state ———
  if (view === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <p className="text-xl font-semibold text-gray-800 mb-2">پیشنهادت ثبت شد 👌</p>
        <p className="text-gray-600 text-sm mb-6">بعد از بررسی اضافه می‌شود.</p>
        <button
          type="button"
          onClick={handleSuccessClose}
          className="px-8 py-3 rounded-xl bg-primary text-white font-medium"
        >
          باشه
        </button>
      </div>
    );
  }

  // ——— Step 2 – Optional details ———
  if (view === 'step2') {
    return (
      <div className="flex flex-col h-full">
        <button
          type="button"
          onClick={() => setView('step1')}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-2 self-start"
        >
          <ChevronLeft className="w-4 h-4" />
          بازگشت
        </button>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">جزئیات بیشتر (اختیاری)</h2>
        <StepProgress step={2} total={2} />

        <form onSubmit={handleStep2Submit} className="space-y-4 flex-1 flex flex-col">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">لینک مرتبط (اختیاری)</label>
            <input
              type="url"
              value={formData.externalUrl}
              onChange={(e) => setFormData((p) => ({ ...p, externalUrl: e.target.value }))}
              placeholder="لینک سایت، اینستاگرام یا صفحه معرفی"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تصویر (اختیاری)</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))}
              placeholder="لینک تصویر یا آپلود فایل"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary mb-2"
            />
            <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-gray-300 text-gray-500 text-sm cursor-pointer hover:bg-gray-50">
              <ImageIcon className="w-4 h-4" />
              {imageUploading ? 'در حال آپلود...' : 'انتخاب فایل'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={imageUploading}
              />
            </label>
          </div>

          <div className="mt-auto pt-4 space-y-3">
            <button
              type="submit"
              disabled={formSubmitting}
              className="w-full py-3 rounded-xl bg-primary text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {formSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              ارسال برای بررسی ✨
            </button>
            <p className="text-xs text-gray-500 text-center">
              بعد از بررسی منتشر می‌شود و اسم تو به عنوان پیشنهاددهنده ثبت می‌شود.
            </p>
          </div>
        </form>
      </div>
    );
  }

  // ——— Step 1 – Basic info ———
  if (view === 'step1') {
    return (
      <div className="flex flex-col h-full">
        <button
          type="button"
          onClick={() => setView('search')}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-2 self-start"
        >
          <ChevronLeft className="w-4 h-4" />
          بازگشت به جستجو
        </button>
        <h2 className="text-lg font-semibold text-gray-800">افزودن مورد جدید ✨</h2>
        <p className="text-sm text-gray-500 mb-3">این مورد هنوز تو وایب ثبت نشده</p>
        <StepProgress step={1} total={2} />

        <form onSubmit={handleStep1Next} className="space-y-4 flex-1 flex flex-col">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان (اجباری)</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              placeholder={getTitlePlaceholder(categorySlug)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
              required
            />
          </div>

          {showCategorySelector && categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">دسته (اگر از قبل مشخص نیست)</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, categoryId: p.categoryId === c.id ? '' : c.id }))}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      formData.categoryId === c.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              توضیح کوتاه (اختیاری)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  description: e.target.value.slice(0, MAX_DESCRIPTION_LENGTH),
                }))
              }
              placeholder="یک توضیح کوتاه بنویس که چرا ارزش اضافه شدن دارد..."
              maxLength={MAX_DESCRIPTION_LENGTH}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
            />
            <p className="text-xs text-gray-400 mt-1 text-start">
              {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
            </p>
          </div>

          <div className="mt-auto pt-2">
            <button
              type="submit"
              disabled={!formData.title.trim()}
              className="w-full py-3 rounded-xl bg-primary text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              ادامه
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ——— Step 0 – Search ———
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">چی می‌خوای اضافه کنی؟</h2>
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={getSearchPlaceholder(categorySlug)}
          className="w-full pl-4 pr-11 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
          autoFocus
        />
      </div>

      {query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH && (
        <p className="text-sm text-gray-500 mb-3">حداقل ۲ حرف وارد کن</p>
      )}

      {/* پیشنهادهای مرتبط — فقط وقتی جستجو خالی است */}
      {query.trim().length === 0 && autoSuggestItems.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-800 mb-1">✨ پیشنهادهای مرتبط</p>
          <p className="text-xs text-gray-500 mb-2">شاید اینا به کارت بیاد</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1">
            {autoSuggestItems.map((item) => {
              const status = autoSuggestStatusMap[item.id] ?? 'idle';
              const done = status === 'success' || status === 'alreadySuggested';
              return (
                <div
                  key={item.id}
                  className={`min-w-[140px] rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden flex-shrink-0 transition-opacity ${done ? 'opacity-60' : ''}`}
                >
                  <div className="h-20 w-full bg-gray-100">
                    <ImageWithFallback
                      src={item.image ?? ''}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      fallbackIcon="📋"
                      fallbackClassName="w-full h-full flex items-center justify-center text-xl"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium text-gray-800 truncate" title={item.title}>
                      {item.title}
                    </p>
                    {item.category && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{item.category}</p>
                    )}
                    <button
                      type="button"
                      disabled={status === 'submitting' || done}
                      onClick={() => handleAutoSuggestClick(item)}
                      className="mt-2 w-full text-xs bg-primary text-white rounded-lg py-1.5 font-medium disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {status === 'submitting' && <Loader2 className="w-3 h-3 animate-spin" />}
                      {status === 'success' && 'ثبت شد ✨'}
                      {status === 'alreadySuggested' && 'قبلاً پیشنهاد شده ✔'}
                      {status === 'idle' && '+ پیشنهاد'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0 space-y-3">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* No results → کارت بزرگ "افزودن مورد جدید" */}
        {!loading && debouncedQuery.length >= MIN_QUERY_LENGTH && results.length === 0 && (
          <div className="py-4">
            <div className="rounded-2xl border-2 border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-white p-6 text-center shadow-sm">
              <p className="text-lg font-semibold text-gray-800 mb-1">هنوز تو وایب ثبت نشده 👀</p>
              <p className="text-gray-600 text-sm mb-5">دوست داری اولینش باشی؟</p>
              <button
                type="button"
                onClick={goToCreate}
                className="w-full py-3.5 px-4 rounded-xl bg-primary text-white font-medium shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                افزودن مورد جدید ✨
              </button>
            </div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <ul className="space-y-3 pb-4">
            {results.map((item) => {
              const isExpanded = expandedItemId === item.id;
              const status = submitStatusMap[item.id] ?? 'idle';
              const emoji = getCategoryEmoji(item.categorySlug);

              // حالت ۲: داخل همین لیست است — بدون دکمه، غیرقابل کلیک
              if (item.alreadyInList) {
                return (
                  <li
                    key={item.id}
                    className="flex gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <ImageWithFallback
                        src={item.imageUrl ?? ''}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        fallbackIcon="📋"
                        fallbackClassName="w-full h-full flex items-center justify-center text-xl"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">{item.title}</p>
                      {item.categoryName && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.categoryName}</p>
                      )}
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        قبلاً داخل لیست است ✔
                      </p>
                    </div>
                  </li>
                );
              }

              // حالت ۳: قبلاً پیشنهاد شده — مشاهده پیشنهاد
              if (item.alreadySuggested) {
                return (
                  <li
                    key={item.id}
                    className="flex gap-3 p-3 rounded-xl border border-gray-100 bg-white shadow-sm"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <ImageWithFallback
                        src={item.imageUrl ?? ''}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        fallbackIcon="📋"
                        fallbackClassName="w-full h-full flex items-center justify-center text-xl"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">{item.title}</p>
                      {item.categoryName && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.categoryName}</p>
                      )}
                      <p className="text-sm text-amber-700 mt-1">👌 این مورد قبلاً پیشنهاد شده</p>
                      <p className="text-xs text-gray-500 mt-0.5">می‌تونی به پیشنهادش رأی بدی</p>
                      {item.suggestionCommentId && (
                        <button
                          type="button"
                          onClick={() => handleViewSuggestion(item.suggestionCommentId!)}
                          className="mt-2 text-sm font-medium text-primary hover:underline"
                        >
                          مشاهده پیشنهاد
                        </button>
                      )}
                    </div>
                  </li>
                );
              }

              // حالت ۱: در وایب هست، داخل این لیست نیست — کارت قابل گسترش
              return (
                <li
                  key={item.id}
                  className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-all ${
                    isExpanded ? 'border-primary/30 ring-2 ring-primary/10' : 'border-gray-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => expandCard(item)}
                    className="w-full flex gap-3 p-3 text-right"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <ImageWithFallback
                        src={item.imageUrl ?? ''}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        fallbackIcon="📋"
                        fallbackClassName="w-full h-full flex items-center justify-center text-xl"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">{item.title}</p>
                      {item.categoryName && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.categoryName}</p>
                      )}
                      <p className="text-xs text-primary mt-1">در وایب ثبت شده</p>
                    </div>
                  </button>

                  {/* Expanded: پیشنهاد به این لیست + توضیح اختیاری */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-4">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {emoji} {item.title}
                        </p>
                        {item.categoryName && (
                          <p className="text-sm text-gray-500 mt-0.5">{item.categoryName}</p>
                        )}
                        <p className="text-sm text-primary mt-1">در وایب ثبت شده</p>
                        <p className="text-sm text-gray-600 mt-2">میخوای به این لیست پیشنهادش بدی؟</p>
                      </div>

                      {status === 'success' && (
                        <div className="rounded-xl bg-green-50 border border-green-200/60 p-3">
                          <p className="font-medium text-green-800">پیشنهادت ثبت شد ✨</p>
                          <p className="text-sm text-green-700 mt-0.5">منتظر تأیید صاحب لیست هستیم</p>
                          <button type="button" disabled className="mt-3 w-full py-2.5 rounded-xl bg-gray-200 text-gray-500 text-sm font-medium">
                            در انتظار بررسی
                          </button>
                        </div>
                      )}

                      {status === 'alreadySuggested' && (
                        <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-3">
                          <p className="text-sm text-amber-800">👌 این مورد قبلاً پیشنهاد شده</p>
                          <p className="text-xs text-amber-700 mt-1">می‌تونی به پیشنهادش رأی بدی</p>
                          <button
                            type="button"
                            onClick={() => handleViewSuggestion(alreadySuggestedCommentId || item.suggestionCommentId || '')}
                            className="mt-2 text-sm font-medium text-primary hover:underline"
                          >
                            مشاهده پیشنهاد
                          </button>
                        </div>
                      )}

                      {(status === 'idle' || status === 'submitting') && (
                        <>
                          <button
                            type="button"
                            disabled={status === 'submitting'}
                            onClick={() => handleSuggestToLink(item, optionalNote)}
                            className="w-full py-3 rounded-xl bg-primary text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {status === 'submitting' ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : null}
                            ✨ پیشنهاد به این لیست
                          </button>
                          <button
                            type="button"
                            onClick={() => setOptionalNoteOpen((o) => !o)}
                            className="text-xs text-gray-500 hover:text-primary"
                          >
                            {optionalNoteOpen ? 'بستن توضیح' : 'افزودن توضیح اختیاری'}
                          </button>
                          {optionalNoteOpen && (
                            <textarea
                              value={optionalNote}
                              onChange={(e) => setOptionalNote(e.target.value)}
                              placeholder="توضیح کوتاه (اختیاری)"
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/25"
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!loading && debouncedQuery.length >= MIN_QUERY_LENGTH && results.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={goToCreate}
              className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              افزودن مورد جدید
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
