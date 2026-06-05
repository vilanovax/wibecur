'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import CategoryWeightCard, { type WeightValue } from '@/components/admin/categories/CategoryWeightCard';
import CategoryFormIdentity from '@/components/admin/categories/CategoryFormIdentity';
import CategoryPageAppearanceFields from '@/components/admin/categories/CategoryPageAppearanceFields';
import CategoryFormPublishSummary from '@/components/admin/categories/CategoryFormPublishSummary';
import CategoryFormStepper, {
  type CategoryFormStep,
} from '@/components/admin/categories/CategoryFormStepper';
import CategoryFormStickyPreview from '@/components/admin/categories/CategoryFormStickyPreview';
import type { CategoryLayoutType } from '@/types/category-page';
import { isValidCategorySlug } from '@/lib/admin/category-intelligence';
import { slugifyCategoryName } from '@/lib/admin/category-slug';
import { useCategorySlugCheck } from '@/hooks/useCategorySlugCheck';
import Toast from '@/components/shared/Toast';

export default function NewCategoryPage() {
  const router = useRouter();
  const [step, setStep] = useState<CategoryFormStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [slugAutoMode, setSlugAutoMode] = useState(true);
  const [orderAuto, setOrderAuto] = useState(true);
  const [suggestedOrder, setSuggestedOrder] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    color: '#6366F1',
    accentColor: '',
    heroImage: '',
    layoutType: '' as CategoryLayoutType | '',
    description: '',
    order: 0,
    isActive: false,
    trendingWeight: 1.0 as WeightValue,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/categories/next-order');
        const data = await res.json();
        if (!cancelled && res.ok && typeof data.nextOrder === 'number') {
          setSuggestedOrder(data.nextOrder);
        }
      } catch {
        // fallback: order 0
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (orderAuto && suggestedOrder !== null) {
      setFormData((prev) => ({ ...prev, order: suggestedOrder }));
    }
  }, [orderAuto, suggestedOrder]);

  const slugValid = useMemo(() => isValidCategorySlug(formData.slug), [formData.slug]);
  const { state: slugCheck, isSlugBlocked } = useCategorySlugCheck(formData.slug, {
    enabled: slugValid,
  });

  const step1Valid =
    formData.name.trim().length > 0 &&
    formData.icon.trim().length > 0 &&
    slugValid &&
    slugCheck.status === 'available';

  const canSubmit = step1Valid;

  const handleNameChange = useCallback(
    (name: string) => {
      setFormData((prev) => ({
        ...prev,
        name,
        slug: slugAutoMode ? slugifyCategoryName(name) : prev.slug,
      }));
    },
    [slugAutoMode]
  );

  const handleSlugChange = useCallback((slug: string) => {
    setSlugAutoMode(false);
    setFormData((prev) => ({ ...prev, slug }));
  }, []);

  const handleResetSlugAuto = useCallback(() => {
    if (slugAutoMode) {
      setSlugAutoMode(false);
      return;
    }
    setSlugAutoMode(true);
    setFormData((prev) => ({
      ...prev,
      slug: slugifyCategoryName(prev.name),
    }));
  }, [slugAutoMode]);

  const handleApplySuggestion = useCallback((slug: string) => {
    setSlugAutoMode(false);
    setFormData((prev) => ({ ...prev, slug }));
  }, []);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          accentColor: formData.accentColor || null,
          heroImage: formData.heroImage || null,
          layoutType: formData.layoutType || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'خطا در ایجاد دسته‌بندی');
      }

      setToast({
        message: formData.isActive
          ? 'دسته‌بندی ایجاد و منتشر شد'
          : 'پیش‌نویس دسته ذخیره شد — از لیست می‌توانید فعال کنید',
        type: 'success',
      });
      setTimeout(() => {
        router.push('/admin/categories');
        router.refresh();
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ایجاد دسته‌بندی';
      setError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (name === 'order') setOrderAuto(false);
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleResetOrderAuto = () => {
    if (orderAuto) {
      setOrderAuto(false);
      return;
    }
    setOrderAuto(true);
    if (suggestedOrder !== null) {
      setFormData((prev) => ({ ...prev, order: suggestedOrder }));
    }
  };

  const goNext = () => {
    if (step === 1 && !step1Valid) {
      if (isSlugBlocked) {
        setError('slug تکراری یا نامعتبر است — پیشنهاد جایگزین را انتخاب کنید');
      } else if (slugCheck.status === 'checking') {
        setError('لطفاً تا پایان بررسی slug صبر کنید');
      } else {
        setError('نام، آیکون و slug معتبر الزامی است');
      }
      return;
    }
    setError('');
    if (step < 3) setStep((step + 1) as CategoryFormStep);
  };

  const goPrev = () => {
    setError('');
    if (step > 1) setStep((step - 1) as CategoryFormStep);
  };

  const sectionCard =
    'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden';

  return (
    <div className="max-w-5xl" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">دسته‌بندی جدید</h1>
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm"
        >
          <ChevronRight className="w-4 h-4" />
          بازگشت
        </Link>
      </div>

      <CategoryFormStepper
        current={step}
        completedThrough={step >= 3 ? 3 : step >= 2 && step1Valid ? 2 : step1Valid ? 1 : 1}
        onStepClick={(s) => {
          if (s === 1) setStep(1);
          if (s === 2 && step1Valid) setStep(2);
          if (s === 3 && step1Valid) setStep(3);
        }}
      />

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          {/* پیش‌نمایش موبایل */}
          <div className="lg:hidden">
            <CategoryFormStickyPreview step={step} values={formData} />
          </div>

          {step === 1 && (
            <section className={sectionCard}>
              <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                <h2 className="font-semibold text-[var(--color-text)]">هویت دسته</h2>
              </div>
              <div className="p-5">
                <CategoryFormIdentity
                  values={{
                    name: formData.name,
                    slug: formData.slug,
                    icon: formData.icon,
                    color: formData.color,
                    accentColor: formData.accentColor,
                    description: formData.description,
                  }}
                  onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
                  onNameChange={handleNameChange}
                  onSlugChange={handleSlugChange}
                  slugAutoMode={slugAutoMode}
                  onResetSlugAuto={handleResetSlugAuto}
                  slugCheck={slugCheck}
                  onApplySlugSuggestion={handleApplySuggestion}
                  showInlinePreview={false}
                />
              </div>
            </section>
          )}

          {step === 2 && (
            <section className={sectionCard}>
              <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                <h2 className="font-semibold text-[var(--color-text)]">ظاهر صفحه دسته در اپ</h2>
              </div>
              <div className="p-5">
                <CategoryPageAppearanceFields
                  values={{
                    accentColor: formData.accentColor,
                    layoutType: formData.layoutType,
                    heroImage: formData.heroImage,
                  }}
                  onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
                  primaryColor={formData.color}
                />
                {!formData.accentColor && (
                  <button
                    type="button"
                    className="mt-3 text-sm text-[var(--primary)] hover:underline"
                    onClick={() => setFormData((p) => ({ ...p, accentColor: p.color }))}
                  >
                    کپی رنگ اصلی به رنگ تاکید
                  </button>
                )}
              </div>
            </section>
          )}

          {step === 3 && (
            <section className={sectionCard}>
              <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                <h2 className="font-semibold text-[var(--color-text)]">بررسی و انتشار</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  پیش‌فرض: پیش‌نویس — بعد از تکمیل hero می‌توانید فعال کنید
                </p>
              </div>
              <div className="p-5 space-y-5">
                <CategoryFormPublishSummary
                  values={formData}
                  orderAuto={orderAuto}
                  suggestedOrder={suggestedOrder}
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-[var(--color-text)]">نوع ذخیره</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, isActive: false }))}
                      className={`rounded-xl border p-4 text-right transition-colors ${
                        !formData.isActive
                          ? 'border-amber-400 bg-amber-50/80 dark:bg-amber-900/20 ring-1 ring-amber-400/50'
                          : 'border-[var(--color-border)] hover:bg-[var(--color-bg)]'
                      }`}
                    >
                      <p className="text-sm font-semibold text-[var(--color-text)]">پیش‌نویس</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        غیرفعال — فقط در پنل ادمین دیده می‌شود
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, isActive: true }))}
                      className={`rounded-xl border p-4 text-right transition-colors ${
                        formData.isActive
                          ? 'border-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/20 ring-1 ring-emerald-400/50'
                          : 'border-[var(--color-border)] hover:bg-[var(--color-bg)]'
                      }`}
                    >
                      <p className="text-sm font-semibold text-[var(--color-text)]">انتشار در اپ</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        فعال — بلافاصله برای کاربران نمایش داده می‌شود
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label htmlFor="order" className="block text-sm font-medium text-[var(--color-text)]">
                      ترتیب نمایش
                    </label>
                    {suggestedOrder !== null && (
                      <button
                        type="button"
                        onClick={handleResetOrderAuto}
                        className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {orderAuto ? 'ویرایش دستی' : `بازگشت به ${suggestedOrder.toLocaleString('fa-IR')} (خودکار)`}
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    id="order"
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
                    min={0}
                    readOnly={orderAuto}
                    className={`w-full max-w-[120px] px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--primary)] ${
                      orderAuto ? 'bg-[var(--color-bg)] cursor-default' : ''
                    }`}
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {orderAuto && suggestedOrder !== null
                      ? `پیشنهاد خودکار: ${suggestedOrder.toLocaleString('fa-IR')} (آخر لیست)`
                      : 'عدد کوچکتر = نمایش زودتر'}
                  </p>
                </div>

                <details className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50">
                  <summary className="px-4 py-3 text-sm font-medium text-[var(--color-text)] cursor-pointer">
                    وزن الگوریتمی (پیشرفته)
                  </summary>
                  <div className="px-4 pb-4">
                    <CategoryWeightCard
                      value={formData.trendingWeight}
                      onChange={(w) => setFormData((prev) => ({ ...prev, trendingWeight: w }))}
                      canEdit={true}
                    />
                  </div>
                </details>
              </div>
            </section>
          )}

          <div className="flex gap-3 sticky bottom-4 bg-[var(--color-surface)]/95 backdrop-blur p-3 rounded-xl border border-[var(--color-border)] shadow-lg z-10">
            {step > 1 ? (
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex items-center gap-1 px-4 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] font-medium hover:bg-[var(--color-bg)]"
              >
                <ChevronRight className="w-4 h-4" />
                قبلی
              </button>
            ) : (
              <Link
                href="/admin/categories"
                className="px-4 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] font-medium hover:bg-[var(--color-bg)]"
              >
                انصراف
              </Link>
            )}

            <div className="flex-1" />

            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={step === 1 && !step1Valid}
                className="inline-flex items-center gap-1 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:opacity-90 disabled:opacity-50"
              >
                بعدی
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canSubmit}
                className="px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'در حال ذخیره...'
                  : formData.isActive
                    ? 'ایجاد و انتشار'
                    : 'ذخیره پیش‌نویس'}
              </button>
            )}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <CategoryFormStickyPreview step={step} values={formData} />
          </div>
        </aside>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={4000} />
      )}
    </div>
  );
}
