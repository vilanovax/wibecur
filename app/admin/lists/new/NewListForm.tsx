'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { categories } from '@prisma/client';
import ListCoverImageFields from '@/components/admin/lists/ListCoverImageFields';
import ListFormIdentity from '@/components/admin/lists/ListFormIdentity';
import ListFormStickyPreview from '@/components/admin/lists/ListFormStickyPreview';
import ListEditStatusToggles from '@/components/admin/lists/ListEditStatusToggles';
import ListNewFormStepper, { type ListNewFormStep } from '@/components/admin/lists/ListNewFormStepper';
import { slugFromTitle, normalizeListSlug, isValidListSlug } from '@/lib/admin/list-slug';
import {
  buildSlugFromListTitle,
  generateListDescriptionWithAi,
  resolveAvailableListSlug,
} from '@/lib/admin/list-form-quick-actions';
import { useListSlugCheck } from '@/hooks/useListSlugCheck';
import Toast, { type ToastType } from '@/components/shared/Toast';

interface NewListFormProps {
  categories: categories[];
}

type FormState = {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  horizontalImage: string;
  categoryId: string;
  badge: string;
  isPublic: boolean;
  isFeatured: boolean;
  isActive: boolean;
  commentsEnabled: boolean;
};

const sectionCard =
  'rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden';

export default function NewListForm({ categories: categoryList }: NewListFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<ListNewFormStep>(1);
  const [loading, setLoading] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [quickFillLoading, setQuickFillLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [slugAutoMode, setSlugAutoMode] = useState(true);
  const [formData, setFormData] = useState<FormState>({
    title: '',
    slug: '',
    description: '',
    coverImage: '',
    horizontalImage: '',
    categoryId: categoryList[0]?.id || '',
    badge: '',
    isPublic: true,
    isFeatured: false,
    isActive: true,
    commentsEnabled: true,
  });

  const slugValid = useMemo(() => isValidListSlug(formData.slug), [formData.slug]);
  const { state: slugCheck, isSlugBlocked } = useListSlugCheck(formData.slug, {
    enabled: slugValid && formData.slug.length > 0,
  });

  const slugReady =
    slugValid && formData.slug.length > 0 && slugCheck.status === 'available' && !isSlugBlocked;

  const selectedCategory = categoryList.find((c) => c.id === formData.categoryId);

  const previewValues = {
    title: formData.title,
    slug: formData.slug,
    description: formData.description,
    coverImage: formData.coverImage,
    horizontalImage: formData.horizontalImage,
    categoryName: selectedCategory?.name ?? '—',
    categoryIcon: selectedCategory?.icon ?? '📋',
    categoryColor: selectedCategory?.color ?? '#6366F1',
    isPublic: formData.isPublic,
    isFeatured: formData.isFeatured,
    isActive: formData.isActive,
    badge: formData.badge,
  };

  const step1Valid =
    formData.title.trim().length > 0 &&
    slugValid &&
    !!formData.categoryId &&
    slugCheck.status === 'available';

  const completedThrough: ListNewFormStep = step1Valid ? 2 : 1;

  const handleTitleChange = useCallback(
    (title: string) => {
      setFormData((prev) => ({
        ...prev,
        title,
        slug: slugAutoMode ? slugFromTitle(title) : prev.slug,
      }));
    },
    [slugAutoMode]
  );

  const handleSlugChange = useCallback((slug: string) => {
    setSlugAutoMode(false);
    setFormData((prev) => ({ ...prev, slug: normalizeListSlug(slug) }));
  }, []);

  const handleApplySuggestion = useCallback((slug: string) => {
    setSlugAutoMode(false);
    setFormData((prev) => ({ ...prev, slug }));
  }, []);

  const applyGeneratedSlug = useCallback(async () => {
    if (!formData.title.trim()) {
      setToast({ message: 'ابتدا عنوان لیست را وارد کنید', type: 'error' });
      return;
    }
    setGeneratingSlug(true);
    try {
      const base = buildSlugFromListTitle(formData.title);
      const slug = await resolveAvailableListSlug(base);
      setSlugAutoMode(true);
      setFormData((prev) => ({ ...prev, slug }));
    } catch (e: unknown) {
      setToast({
        message: e instanceof Error ? e.message : 'خطا در تولید slug',
        type: 'error',
      });
    } finally {
      setGeneratingSlug(false);
    }
  }, [formData.title]);

  const applyGeneratedDescription = useCallback(async () => {
    if (!formData.title.trim()) {
      setToast({ message: 'ابتدا عنوان را وارد کنید', type: 'error' });
      return;
    }
    if (!selectedCategory) {
      setToast({ message: 'دسته را انتخاب کنید', type: 'error' });
      return;
    }
    setGeneratingDescription(true);
    try {
      const description = await generateListDescriptionWithAi({
        title: formData.title,
        categorySlug: selectedCategory.slug,
        categoryName: selectedCategory.name,
      });
      setFormData((prev) => ({ ...prev, description }));
      setToast({ message: 'توضیحات با AI تولید شد', type: 'success' });
    } catch (e: unknown) {
      setToast({
        message: e instanceof Error ? e.message : 'خطا در تولید توضیحات',
        type: 'error',
      });
    } finally {
      setGeneratingDescription(false);
    }
  }, [formData.title, selectedCategory]);

  const handleQuickFill = useCallback(async () => {
    if (!formData.title.trim() || !selectedCategory) return;
    setQuickFillLoading(true);
    try {
      const base = buildSlugFromListTitle(formData.title);
      const slug = await resolveAvailableListSlug(base);
      const description = await generateListDescriptionWithAi({
        title: formData.title,
        categorySlug: selectedCategory.slug,
        categoryName: selectedCategory.name,
      });
      setSlugAutoMode(true);
      setFormData((prev) => ({ ...prev, slug, description }));
      setToast({ message: 'Slug و توضیحات آماده شد', type: 'success' });
    } catch (e: unknown) {
      setToast({
        message: e instanceof Error ? e.message : 'خطا در تکمیل سریع',
        type: 'error',
      });
    } finally {
      setQuickFillLoading(false);
    }
  }, [formData.title, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slugReady || !formData.categoryId || isSlugBlocked) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'خطا در ایجاد لیست');
      }
      const list = await response.json();
      setToast({ message: 'لیست ساخته شد — اکنون آیتم اضافه کنید', type: 'success' });
      router.push(`/admin/lists/${list.id}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ایجاد لیست';
      setError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-4" dir="rtl">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <Link
            href="/admin/lists"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--primary)] mb-2"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            بازگشت به لیست‌ها
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-text)]">لیست جدید</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">ایجاد لیست جدید در پلتفرم</p>
        </div>
      </header>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
        <form id="list-new-form" onSubmit={handleSubmit} className="space-y-4 min-w-0">
          <ListNewFormStepper
            current={step}
            completedThrough={completedThrough}
            onStepClick={(s) => {
              if (s === 1) setStep(1);
              if (s === 2 && step1Valid) setStep(2);
            }}
          />

          <div className="lg:hidden">
            <ListFormStickyPreview values={previewValues} step={step === 1 ? 1 : 2} />
          </div>

          {step === 1 && (
            <section className={sectionCard}>
              <div className="px-4 py-3 border-b border-[var(--color-border-muted)] bg-[var(--color-bg)]/50">
                <h2 className="text-sm font-semibold text-[var(--color-text)]">اطلاعات پایه</h2>
              </div>
              <div className="p-4">
                <ListFormIdentity
                  values={{
                    title: formData.title,
                    slug: formData.slug,
                    description: formData.description,
                    categoryId: formData.categoryId,
                  }}
                  categories={categoryList}
                  onChange={(patch) => setFormData((p) => ({ ...p, ...patch }))}
                  onTitleChange={handleTitleChange}
                  onSlugChange={handleSlugChange}
                  slugAutoMode={slugAutoMode}
                  onResetSlugAuto={() => setSlugAutoMode((m) => !m)}
                  slugCheck={slugCheck}
                  onApplySlugSuggestion={handleApplySuggestion}
                  showQuickActions
                  onGenerateSlug={() => void applyGeneratedSlug()}
                  generatingSlug={generatingSlug}
                  onGenerateDescription={() => void applyGeneratedDescription()}
                  generatingDescription={generatingDescription}
                  onQuickFill={() => void handleQuickFill()}
                  quickFillLoading={quickFillLoading}
                />
              </div>
            </section>
          )}

          {step === 2 && (
            <>
              <section className={sectionCard}>
                <div className="px-4 py-3 border-b border-[var(--color-border-muted)] bg-[var(--color-bg)]/50">
                  <h2 className="text-sm font-semibold text-[var(--color-text)]">نمایش و وضعیت</h2>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                    Featured = اسلات صفحه اصلی · نشان = برچسب روی کارت
                  </p>
                </div>
                <div className="p-4">
                  <ListEditStatusToggles
                    values={{
                      isPublic: formData.isPublic,
                      isFeatured: formData.isFeatured,
                      isActive: formData.isActive,
                      commentsEnabled: formData.commentsEnabled,
                    }}
                    onChange={(key, value) => setFormData((p) => ({ ...p, [key]: value }))}
                  />
                </div>
              </section>

              <section className={sectionCard}>
                <div className="px-4 py-3 border-b border-[var(--color-border-muted)] bg-[var(--color-bg)]/50">
                  <h2 className="text-sm font-semibold text-[var(--color-text)]">ظاهر</h2>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                      نشان روی کارت
                    </label>
                    <select
                      value={formData.badge}
                      onChange={(e) => setFormData((p) => ({ ...p, badge: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm"
                    >
                      <option value="">بدون نشان</option>
                      <option value="TRENDING">Trending</option>
                      <option value="NEW">New</option>
                      <option value="FEATURED">Featured badge</option>
                    </select>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                      جدا از Featured صفحه اصلی
                    </p>
                  </div>
                  <ListCoverImageFields
                    coverImage={formData.coverImage}
                    horizontalImage={formData.horizontalImage}
                    onCoverChange={(url) => setFormData((p) => ({ ...p, coverImage: url }))}
                    onHorizontalChange={(url) => setFormData((p) => ({ ...p, horizontalImage: url }))}
                  />
                </div>
              </section>
            </>
          )}

          <div className="sticky bottom-0 z-20 -mx-1 px-1 py-3 bg-[var(--color-bg)]/95 backdrop-blur-md border-t border-[var(--color-border)] shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)]">
            <div className="flex flex-wrap items-center gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                >
                  <ChevronRight className="w-4 h-4" />
                  قبلی
                </button>
              )}

              {step < 2 ? (
                <button
                  type="button"
                  onClick={() => step1Valid && setStep(2)}
                  disabled={!step1Valid}
                  className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  بعدی
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !slugReady || isSlugBlocked}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'در حال ایجاد...' : 'ایجاد لیست'}
                </button>
              )}

              <Link
                href="/admin/lists"
                className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              >
                انصراف
              </Link>
            </div>
          </div>
        </form>

        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <ListFormStickyPreview values={previewValues} step={step === 1 ? 1 : 2} />
          </div>
        </aside>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={3500} />
      )}
    </div>
  );
}
