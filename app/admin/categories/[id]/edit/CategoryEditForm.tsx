'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { categories } from '@prisma/client';
import CategoryWeightCard, {
  WEIGHT_LEVELS,
  type WeightValue,
} from '@/components/admin/categories/CategoryWeightCard';
import CategoryImpactCard from '@/components/admin/categories/CategoryImpactCard';
import CategoryFormIdentity from '@/components/admin/categories/CategoryFormIdentity';
import CategoryFormStickyPreview from '@/components/admin/categories/CategoryFormStickyPreview';
import CategoryEditHeaderActions from '@/components/admin/categories/CategoryEditHeaderActions';
import CategoryEditFormBar from '@/components/admin/categories/CategoryEditFormBar';
import { formatSaveGrowthDisplay, isValidCategorySlug, CATEGORY_BOOST_WEIGHT } from '@/lib/admin/category-intelligence';
import CategoryPageAppearanceFields from '@/components/admin/categories/CategoryPageAppearanceFields';
import { useCategorySlugCheck } from '@/hooks/useCategorySlugCheck';
import Toast, { type ToastType } from '@/components/shared/Toast';
import type { CategoryLayoutType } from '@/types/category-page';

function toWeightValue(n: number | null | undefined): WeightValue {
  if (n == null || !Number.isFinite(n)) return 1.0;
  const found = WEIGHT_LEVELS.find((l) => Math.abs(l.value - n) < 0.01);
  return found ? found.value : 1.0;
}

interface CategoryAnalytics {
  listCount: number;
  saveGrowthPercent: number;
  saveGrowthRecent: number;
  saveGrowthPrevious: number;
  engagementRatio: number;
  avgSavesPerList: number;
}

type FormState = {
  name: string;
  slug: string;
  icon: string;
  color: string;
  accentColor: string;
  heroImage: string;
  layoutType: CategoryLayoutType | '';
  description: string;
  order: number;
  isActive: boolean;
  commentsEnabled: boolean;
  trendingWeight: WeightValue;
};

function buildInitialForm(category: categories): FormState {
  return {
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    color: category.color,
    accentColor: category.accentColor || '',
    heroImage: category.heroImage || '',
    layoutType: (category.layoutType as CategoryLayoutType) || '',
    description: category.description || '',
    order: category.order,
    isActive: category.isActive,
    commentsEnabled: (category as { commentsEnabled?: boolean }).commentsEnabled ?? true,
    trendingWeight: toWeightValue((category as { trendingWeight?: number }).trendingWeight),
  };
}

interface CategoryEditFormProps {
  category: categories;
  analytics: CategoryAnalytics;
  canEditWeight?: boolean;
}

export default function CategoryEditForm({
  category,
  analytics,
  canEditWeight = true,
}: CategoryEditFormProps) {
  const router = useRouter();
  const initialForm = useMemo(() => buildInitialForm(category), [category]);
  const [formData, setFormData] = useState<FormState>(initialForm);
  const [baseline, setBaseline] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const slugValid = useMemo(() => isValidCategorySlug(formData.slug), [formData.slug]);
  const slugChanged = formData.slug !== category.slug;
  const { state: slugCheck, isSlugBlocked } = useCategorySlugCheck(formData.slug, {
    excludeId: category.id,
    enabled: slugValid && slugChanged,
  });

  const slugReady =
    slugValid &&
    (!slugChanged || slugCheck.status === 'available') &&
    !(slugChanged && slugCheck.status === 'checking');

  const dirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(baseline),
    [formData, baseline]
  );

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const growthDisplay = useMemo(
    () =>
      formatSaveGrowthDisplay(
        analytics.saveGrowthRecent,
        analytics.saveGrowthPrevious,
        analytics.saveGrowthPercent
      ),
    [analytics]
  );

  const handleSlugChange = useCallback((slug: string) => {
    setFormData((prev) => ({ ...prev, slug }));
  }, []);

  const handleApplySuggestion = useCallback((slug: string) => {
    setFormData((prev) => ({ ...prev, slug }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slugReady) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          icon: formData.icon,
          color: formData.color,
          accentColor: formData.accentColor || null,
          heroImage: formData.heroImage || null,
          layoutType: formData.layoutType || null,
          description: formData.description,
          order: formData.order,
          isActive: formData.isActive,
          commentsEnabled: formData.commentsEnabled,
          trendingWeight: formData.trendingWeight,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'خطا در ویرایش دسته‌بندی');
      }
      setToast({ message: 'تغییرات ذخیره شد', type: 'success' });
      setBaseline({ ...formData });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ذخیره';
      setError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (
      !window.confirm(
        `کپی «${category.name}» ساخته می‌شود (بدون لیست‌ها، غیرفعال). ادامه می‌دهید؟`
      )
    ) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/categories/${category.id}/duplicate`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در کپی دسته');
      router.push(`/admin/categories/${data.id}/edit`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در کپی');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToTrash = async () => {
    if (deleteConfirmText !== 'حذف') return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/categories/${category.id}/trash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'خطا در انتقال به زباله‌دان');
      }
      setDeleteConfirmOpen(false);
      router.push('/admin/categories');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در انتقال به زباله‌دان');
    } finally {
      setLoading(false);
    }
  };

  const sectionCard =
    'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden';

  return (
    <>
      <div className="flex flex-col gap-4 mb-6" dir="rtl">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <Link
              href="/admin/categories"
              className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm mb-2"
            >
              <ChevronRight className="w-4 h-4" />
              بازگشت به دسته‌بندی‌ها
            </Link>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">ویرایش دسته‌بندی</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{category.name}</p>
          </div>
          <CategoryEditHeaderActions
            categoryId={category.id}
            categorySlug={formData.slug}
            categoryName={formData.name}
            isActive={formData.isActive}
            trendingWeight={formData.trendingWeight}
            onDuplicate={handleDuplicate}
            duplicateLoading={loading}
            onBoostApplied={() =>
              setFormData((p) => ({ ...p, trendingWeight: CATEGORY_BOOST_WEIGHT }))
            }
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <form id="category-edit-form" onSubmit={handleSubmit} className="space-y-6 min-w-0">
          {/* پیش‌نمایش موبایل */}
          <div className="lg:hidden">
            <CategoryFormStickyPreview step={3} values={formData} />
          </div>

          <section className={sectionCard}>
            <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
              <h2 className="font-semibold text-[var(--color-text)]">هویت</h2>
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
                onChange={(patch) => setFormData((p) => ({ ...p, ...patch }))}
                onSlugChange={handleSlugChange}
                slugCheck={slugChanged ? slugCheck : { status: 'available', slug: formData.slug }}
                onApplySlugSuggestion={handleApplySuggestion}
                showInlinePreview={false}
              />
              {slugChanged && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    با تغییر slug، آدرس اپ از{' '}
                    <span className="font-mono text-xs" dir="ltr">
                      /categories/{category.slug}
                    </span>{' '}
                    به{' '}
                    <span className="font-mono text-xs" dir="ltr">
                      /categories/{formData.slug}
                    </span>{' '}
                    تغییر می‌کند. لینک‌های قدیمی ممکن است کار نکنند.
                  </p>
                </div>
              )}
              {slugChanged && isSlugBlocked && (
                <p className="mt-2 text-xs text-red-600">slug تکراری یا نامعتبر — قبل از ذخیره اصلاح کنید.</p>
              )}
            </div>
          </section>

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
                onChange={(patch) => setFormData((p) => ({ ...p, ...patch }))}
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

          <section className={sectionCard}>
            <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
              <h2 className="font-semibold text-[var(--color-text)]">رتبه‌بندی، نمایش و تعامل</h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                ترتیب، وضعیت انتشار، کامنت‌ها و وزن الگوریتم
              </p>
            </div>
            <div className="p-5 space-y-5">
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
                  <p className="text-sm font-semibold text-[var(--color-text)]">غیرفعال</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">در اپ نمایش داده نمی‌شود</p>
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
                  <p className="text-sm font-semibold text-[var(--color-text)]">فعال در اپ</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">برای کاربران قابل مشاهده</p>
                </button>
              </div>

              <div>
                <label htmlFor="order" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  ترتیب نمایش
                </label>
                <input
                  type="number"
                  id="order"
                  name="order"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, order: parseInt(e.target.value, 10) || 0 }))
                  }
                  min={0}
                  className="w-full max-w-[120px] px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--primary)]"
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">عدد کوچکتر = نمایش زودتر</p>
              </div>

              <ToggleRow
                label="فعال بودن کامنت‌ها"
                checked={formData.commentsEnabled}
                onChange={(v) => setFormData((p) => ({ ...p, commentsEnabled: v }))}
              />

              <details
                id="weight"
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50"
                open={formData.trendingWeight !== 1}
              >
                <summary className="px-4 py-3 text-sm font-medium text-[var(--color-text)] cursor-pointer">
                  وزن الگوریتمی (پیشرفته)
                  {formData.trendingWeight !== 1 && (
                    <span className="mr-2 text-xs font-normal text-indigo-600 dark:text-indigo-300">
                      — فعلی: {formData.trendingWeight.toLocaleString('fa-IR')}×
                    </span>
                  )}
                </summary>
                <div className="px-4 pb-4">
                  <CategoryWeightCard
                    value={formData.trendingWeight}
                    onChange={(w) => setFormData((p) => ({ ...p, trendingWeight: w }))}
                    canEdit={canEditWeight}
                  />
                </div>
              </details>
            </div>
          </section>

          <CategoryImpactCard categoryId={category.id} />

          <section className={sectionCard}>
            <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)] flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-[var(--color-text)]">آمار این دسته</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">فقط نمایش</p>
              </div>
              {analytics.listCount > 0 && (
                <Link
                  href={`/admin/lists?category=${encodeURIComponent(category.slug)}`}
                  className="text-xs font-medium text-[var(--primary)] hover:underline"
                >
                  {analytics.listCount.toLocaleString('fa-IR')} لیست — مشاهده همه
                </Link>
              )}
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatBox label="تعداد لیست‌ها" value={analytics.listCount.toLocaleString('fa-IR')} />
              <StatBox label="رشد ذخیره ۷ روز" value={growthDisplay.label} title={growthDisplay.title} />
              <StatBox label="میانگین تعامل" value={`${analytics.engagementRatio.toFixed(1)}٪`} />
              <StatBox
                label="میانگین ذخیره/لیست"
                value={analytics.avgSavesPerList.toLocaleString('fa-IR')}
              />
            </div>
          </section>

          <section className={`${sectionCard} border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10`}>
            <button
              type="button"
              onClick={() => setDangerOpen((o) => !o)}
              className="w-full px-5 py-4 flex items-center justify-between text-right"
            >
              <span className="font-semibold text-red-800 dark:text-red-300">منطقه خطر</span>
              {dangerOpen ? (
                <ChevronDown className="w-5 h-5 text-red-600" />
              ) : (
                <ChevronUp className="w-5 h-5 text-red-600" />
              )}
            </button>
            {dangerOpen && (
              <div className="px-5 pb-5 pt-0 border-t border-red-200/50 dark:border-red-900/30">
                <p className="text-sm text-red-800 dark:text-red-200 mt-4">
                  دسته به زباله‌دان منتقل می‌شود و در اپ نمایش داده نمی‌شود.
                  {analytics.listCount > 0 && (
                    <>
                      {' '}
                      این دسته {analytics.listCount.toLocaleString('fa-IR')} لیست دارد — لیست‌ها حذف
                      نمی‌شوند.
                    </>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={loading}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  انتقال به زباله‌دان
                </button>
              </div>
            )}
          </section>

          <CategoryEditFormBar
            loading={loading}
            canSave={slugReady}
            categorySlug={formData.slug}
            dirty={dirty}
          />
        </form>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <CategoryFormStickyPreview step={3} values={formData} />
          </div>
        </aside>
      </div>

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl max-w-md w-full p-6 border border-[var(--color-border)]">
            <h3 className="font-semibold text-[var(--color-text)] mb-2">تأیید انتقال به زباله‌دان</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              برای انتقال این دسته به زباله‌دان عبارت <strong>حذف</strong> را وارد کنید.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="حذف"
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] mb-4"
              dir="rtl"
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)]"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleMoveToTrash}
                disabled={deleteConfirmText !== 'حذف' || loading}
                className="px-4 py-2 rounded-xl bg-red-600 text-white disabled:opacity-50"
              >
                {loading ? '...' : 'انتقال به زباله‌دان'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={4000} />
      )}
    </>
  );
}

function StatBox({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="p-3 rounded-xl bg-[var(--color-bg)]" title={title}>
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">{value}</p>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          checked ? 'bg-[var(--primary)]' : 'bg-[var(--color-border)]'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
