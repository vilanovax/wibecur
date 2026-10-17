'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, Plus, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import SearchInput from '@/components/mobile/search/SearchInput';
import { fa } from '@/lib/utils';

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
            className={`inline-block size-2 rounded-full transition-colors ${
              i + 1 <= step ? 'bg-brand' : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">مرحله {fa(step)} از {fa(total)}</span>
    </div>
  );
}

function ItemPoster({
  src,
  title,
  className = 'w-11 h-[3.25rem]',
}: {
  src: string | null;
  title: string;
  className?: string;
}) {
  return (
    <div className={`flex-shrink-0 overflow-hidden rounded-surface bg-muted ${className}`}>
      <ImageWithFallback
        src={src ?? ''}
        alt={title}
        className="w-full h-full object-cover"
        fallbackIcon="📋"
        fallbackClassName="w-full h-full flex items-center justify-center text-lg"
      />
    </div>
  );
}

function SuggestActionButton({
  status,
  onClick,
  compact = false,
}: {
  status: 'idle' | 'submitting' | 'success' | 'alreadySuggested';
  onClick: () => void;
  compact?: boolean;
}) {
  const done = status === 'success' || status === 'alreadySuggested';
  if (compact) {
    return (
      <button
        type="button"
        disabled={status === 'submitting' || done}
        onClick={onClick}
        aria-label={done ? 'پیشنهاد ثبت شده' : 'پیشنهاد'}
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
          done ? 'bg-success/15 text-success' : 'bg-brand/10 text-brand'
        } disabled:opacity-60`}
      >
        {status === 'submitting' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : done ? (
          <Check className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={status === 'submitting' || done}
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-control bg-brand text-sm font-semibold text-brand-foreground disabled:opacity-50"
    >
      {status === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
      {status === 'success' && 'ثبت شد ✨'}
      {status === 'alreadySuggested' && 'قبلاً پیشنهاد شده ✔'}
      {status === 'idle' && (
        <>
          <Plus className="w-4 h-4" />
          پیشنهاد به لیست
        </>
      )}
    </button>
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
        <p className="text-xl font-semibold text-foreground mb-2">پیشنهادت ثبت شد 👌</p>
        <p className="text-muted-foreground text-sm mb-6">بعد از بررسی اضافه می‌شود.</p>
        <Button type="button" variant="brand" size="lg" onClick={handleSuccessClose}>
          باشه
        </Button>
      </div>
    );
  }

  // ——— Step 2 – Optional details ———
  if (view === 'step2') {
    return (
      <div className="flex flex-col h-full px-4 pb-4">
        <button
          type="button"
          onClick={() => setView('step1')}
          className="mb-2 flex min-h-11 items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
          بازگشت
        </button>
        <h2 className="text-lg font-semibold text-foreground mb-1">جزئیات بیشتر (اختیاری)</h2>
        <StepProgress step={2} total={2} />

        <form onSubmit={handleStep2Submit} className="space-y-4 flex-1 flex flex-col">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">لینک مرتبط (اختیاری)</label>
            <Input
              type="url"
              dir="ltr"
              value={formData.externalUrl}
              onChange={(e) => setFormData((p) => ({ ...p, externalUrl: e.target.value }))}
              placeholder="لینک سایت، اینستاگرام یا صفحه معرفی"
              className="h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">تصویر (اختیاری)</label>
            <Input
              type="url"
              dir="ltr"
              value={formData.imageUrl}
              onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))}
              placeholder="لینک تصویر یا آپلود فایل"
              className="mb-2 h-12"
            />
            <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-surface border border-dashed border-border px-3 text-sm text-muted-foreground hover:border-brand hover:bg-muted">
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
            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full"
              disabled={formSubmitting}
            >
              {formSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              ارسال برای بررسی ✨
            </Button>
            <p className="text-xs text-muted-foreground text-center">
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
      <div className="flex flex-col h-full px-4 pb-4">
        <button
          type="button"
          onClick={() => setView('search')}
          className="mb-2 flex min-h-11 items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
          بازگشت به جستجو
        </button>
        <h2 className="text-lg font-semibold text-foreground">افزودن مورد جدید ✨</h2>
        <p className="text-sm text-muted-foreground mb-3">این مورد هنوز تو وایب ثبت نشده</p>
        <StepProgress step={1} total={2} />

        <form onSubmit={handleStep1Next} className="space-y-4 flex-1 flex flex-col">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">عنوان (اجباری)</label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              placeholder={getTitlePlaceholder(categorySlug)}
              className="h-12"
              required
            />
          </div>

          {showCategorySelector && categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">دسته (اگر از قبل مشخص نیست)</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, categoryId: p.categoryId === c.id ? '' : c.id }))}
                    className={`h-11 rounded-full px-3 text-sm font-medium ${
                      formData.categoryId === c.id
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-popover text-foreground'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              توضیح کوتاه (اختیاری)
            </label>
            <Textarea
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
              showCount
            />
          </div>

          <div className="mt-auto pt-2">
            <Button type="submit" variant="brand" size="lg" className="w-full" disabled={!formData.title.trim()}>
              ادامه
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ——— Step 0 – Search ———
  return (
    <div className="flex flex-col h-full min-h-0 px-4 pb-4">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={getSearchPlaceholder(categorySlug)}
        autoFocus
        aria-label="جستجوی آیتم برای پیشنهاد"
        className="mb-3 flex-shrink-0"
      />

      {query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH && (
        <p className="wibe-caption text-muted-foreground mb-3 flex-shrink-0">حداقل ۲ حرف وارد کن</p>
      )}

      <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
        {/* پیشنهادهای مرتبط — فقط وقتی جستجو خالی است */}
        {query.trim().length === 0 && autoSuggestItems.length > 0 && (
          <section className="mb-4">
            <p className="wibe-caption font-medium text-muted-foreground mb-2">پیشنهادهای مرتبط</p>
            <ul className="space-y-2">
              {autoSuggestItems.map((item) => {
                const status = autoSuggestStatusMap[item.id] ?? 'idle';
                const done = status === 'success' || status === 'alreadySuggested';
                return (
                  <li key={item.id}>
                    <div
                      className={`flex items-center gap-3 rounded-surface border border-border bg-popover p-2.5 ${
                        done ? 'opacity-60' : ''
                      }`}
                    >
                      <ItemPoster src={item.image} title={item.title} />
                      <div className="min-w-0 flex-1">
                        <p className="wibe-small font-semibold text-foreground truncate" title={item.title}>
                          {item.title}
                        </p>
                        {item.category && (
                          <p className="wibe-caption text-muted-foreground truncate mt-0.5">{item.category}</p>
                        )}
                      </div>
                      <SuggestActionButton
                        compact
                        status={status}
                        onClick={() => handleAutoSuggestClick(item)}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {query.trim().length === 0 && autoSuggestItems.length === 0 && !loading && (
          <p className="wibe-caption text-muted-foreground text-center py-8">
            نام فیلم، سریال یا آیتم را جستجو کن
          </p>
        )}

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        )}

        {/* No results */}
        {!loading && debouncedQuery.length >= MIN_QUERY_LENGTH && results.length === 0 && (
          <div className="py-6 text-center">
            <p className="wibe-small font-semibold text-foreground mb-1">نتیجه‌ای پیدا نشد</p>
            <p className="wibe-caption text-muted-foreground mb-4">هنوز تو وایب ثبت نشده — می‌تونی خودت اضافه کنی</p>
            <Button type="button" variant="brand" size="lg" onClick={goToCreate}>
              <Plus className="size-4" />
              افزودن مورد جدید
            </Button>
          </div>
        )}

        {!loading && results.length > 0 && (
          <ul className="space-y-2 pb-2">
            {results.map((item) => {
              const isExpanded = expandedItemId === item.id;
              const status = submitStatusMap[item.id] ?? 'idle';
              const emoji = getCategoryEmoji(item.categorySlug);

              if (item.alreadyInList) {
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-surface border border-border bg-muted p-2.5"
                  >
                    <ItemPoster src={item.imageUrl} title={item.title} />
                    <div className="min-w-0 flex-1">
                      <p className="wibe-small font-semibold text-foreground truncate">{item.title}</p>
                      {item.categoryName && (
                        <p className="wibe-caption text-muted-foreground mt-0.5">{item.categoryName}</p>
                      )}
                      <p className="mt-1 flex items-center gap-1 text-xs text-success">
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                        داخل لیست است
                      </p>
                    </div>
                  </li>
                );
              }

              if (item.alreadySuggested) {
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-surface border border-border bg-popover p-2.5"
                  >
                    <ItemPoster src={item.imageUrl} title={item.title} />
                    <div className="min-w-0 flex-1">
                      <p className="wibe-small font-semibold text-foreground truncate">{item.title}</p>
                      {item.categoryName && (
                        <p className="wibe-caption text-muted-foreground mt-0.5">{item.categoryName}</p>
                      )}
                      <p className="mt-1 text-xs text-warning">قبلاً پیشنهاد شده</p>
                      {item.suggestionCommentId && (
                        <button
                          type="button"
                          onClick={() => handleViewSuggestion(item.suggestionCommentId!)}
                          className="mt-1 wibe-caption font-medium text-primary hover:underline"
                        >
                          مشاهده پیشنهاد
                        </button>
                      )}
                    </div>
                  </li>
                );
              }

              return (
                <li
                  key={item.id}
                  className={`overflow-hidden rounded-surface border bg-popover ${
                    isExpanded ? 'border-brand/30' : 'border-border'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => expandCard(item)}
                    className="flex min-h-12 w-full items-center gap-3 p-2.5 text-start"
                  >
                    <ItemPoster src={item.imageUrl} title={item.title} />
                    <div className="min-w-0 flex-1">
                      <p className="wibe-small font-semibold text-foreground truncate">{item.title}</p>
                      {item.categoryName && (
                        <p className="wibe-caption text-muted-foreground mt-0.5">{item.categoryName}</p>
                      )}
                    </div>
                    <span className="wibe-caption text-primary shrink-0">انتخاب</span>
                  </button>

                  {isExpanded && (
                    <div className="space-y-3 border-t border-border bg-muted/40 px-3 pb-3 pt-2">
                      <div>
                        <p className="wibe-small font-semibold text-foreground">
                          {emoji} {item.title}
                        </p>
                        <p className="wibe-caption text-muted-foreground mt-1">به این لیست پیشنهاد بده؟</p>
                      </div>

                      {status === 'success' && (
                        <div className="rounded-xl border border-success/20 bg-success/10 p-3">
                          <p className="text-sm font-medium text-success">پیشنهادت ثبت شد ✨</p>
                          <p className="mt-0.5 text-xs text-success">منتظر تأیید صاحب لیست</p>
                        </div>
                      )}

                      {status === 'alreadySuggested' && (
                        <div className="rounded-xl border border-warning/30 bg-warning/10 p-3">
                          <p className="text-xs text-foreground">قبلاً پیشنهاد شده</p>
                          <button
                            type="button"
                            onClick={() => handleViewSuggestion(alreadySuggestedCommentId || item.suggestionCommentId || '')}
                            className="mt-1 wibe-caption font-medium text-primary hover:underline"
                          >
                            مشاهده پیشنهاد
                          </button>
                        </div>
                      )}

                      {(status === 'idle' || status === 'submitting') && (
                        <>
                          <SuggestActionButton
                            status={status}
                            onClick={() => handleSuggestToLink(item, optionalNote)}
                          />
                          <button
                            type="button"
                            onClick={() => setOptionalNoteOpen((o) => !o)}
                            className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-brand"
                          >
                            {optionalNoteOpen ? 'بستن توضیح' : '+ توضیح اختیاری'}
                          </button>
                          {optionalNoteOpen && (
                            <Textarea
                              value={optionalNote}
                              onChange={(e) => setOptionalNote(e.target.value)}
                              placeholder="چرا این آیتم به لیست اضافه شود؟"
                              rows={2}
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
      </div>

      {query.trim().length === 0 && (
        <div className="mt-2 flex-shrink-0 border-t border-border pt-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full border-dashed"
            onClick={goToCreate}
          >
            <Plus className="w-4 h-4" />
            مورد جدید ثبت نشده؟ خودت اضافه کن
          </Button>
        </div>
      )}

      {!loading && debouncedQuery.length >= MIN_QUERY_LENGTH && results.length > 0 && (
        <div className="mt-2 flex-shrink-0 border-t border-border pt-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full border-dashed"
            onClick={goToCreate}
          >
            <Plus className="w-4 h-4" />
            افزودن مورد جدید
          </Button>
        </div>
      )}
    </div>
  );
}
