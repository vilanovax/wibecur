'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { categories } from '@prisma/client';
import CategoryWeightCard, {
  WEIGHT_LEVELS,
  type WeightValue,
} from '@/components/admin/categories/CategoryWeightCard';
import CategoryImpactCard from '@/components/admin/categories/CategoryImpactCard';

const SLUG_REGEX = /^[a-z0-9-]+$/;

interface CategoryAnalytics {
  listCount: number;
  saveGrowthPercent: number;
  engagementRatio: number;
  trendingScoreAvg: number;
}

function toWeightValue(n: number | null | undefined): WeightValue {
  if (n == null || !Number.isFinite(n)) return 1.0;
  const found = WEIGHT_LEVELS.find((l) => Math.abs(l.value - n) < 0.01);
  return found ? found.value : 1.0;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dangerOpen, setDangerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [formData, setFormData] = useState({
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    color: category.color,
    description: category.description || '',
    order: category.order,
    isActive: category.isActive,
    commentsEnabled: (category as { commentsEnabled?: boolean }).commentsEnabled ?? true,
    trendingWeight: toWeightValue((category as { trendingWeight?: number }).trendingWeight),
    boostEnabled: false,
    featured: false,
    showInHome: category.isActive,
    showInExplore: category.isActive,
    strictModeration: false,
    autoFlagSensitivity: 'medium' as 'low' | 'medium' | 'high',
  });

  const slugValid = useMemo(
    () => formData.slug.length > 0 && SLUG_REGEX.test(formData.slug),
    [formData.slug]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      router.push('/admin/categories');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== 'حذف') return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'خطا در حذف');
      }
      setDeleteConfirmOpen(false);
      router.push('/admin/categories');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در حذف');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? parseInt(value, 10) || 0
          : type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : value,
    }));
  };

  const sectionCard = 'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden';

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <ChevronRight className="w-4 h-4" />
          بازگشت
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">ویرایش دسته‌بندی</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1 — Identity */}
        <section className={sectionCard}>
          <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            <h2 className="font-semibold text-[var(--color-text)]">هویت</h2>
          </div>
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  نام *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Slug (نامک) *
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  dir="ltr"
                  className={`w-full px-3 py-2 rounded-xl border bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent ${
                    formData.slug.length === 0
                      ? 'border-[var(--color-border)]'
                      : slugValid
                        ? 'border-emerald-500 ring-1 ring-emerald-500/20'
                        : 'border-red-400 ring-1 ring-red-400/20'
                  }`}
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  حروف انگلیسی کوچک، اعداد و خط تیره
                </p>
                {formData.slug.length > 0 && (
                  <p className={`text-xs mt-1 ${slugValid ? 'text-emerald-600' : 'text-red-600'}`}>
                    {slugValid ? '✓ معتبر' : 'نامک معتبر نیست'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="icon" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  آیکون (Emoji) *
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    id="icon"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    required
                    className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  {formData.icon && (
                    <span className="text-3xl" role="img" aria-label="preview">{formData.icon}</span>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  رنگ
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="h-10 w-14 rounded-lg cursor-pointer border border-[var(--color-border)]"
                  />
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    dir="ltr"
                    className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  توضیحات
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-muted)] mb-2">پیش‌نمایش در اپ</p>
              <div
                className="rounded-2xl border border-[var(--color-border)] p-5 flex items-center gap-4"
                style={{ backgroundColor: formData.color ? `${formData.color}12` : 'var(--color-bg)' }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    backgroundColor: formData.color ? `${formData.color}25` : 'var(--color-bg)',
                    color: formData.color || 'var(--color-text)',
                  }}
                >
                  {formData.icon || '📁'}
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text)]">
                    {formData.name || 'نام دسته'}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] font-mono">
                    /{formData.slug || 'slug'}
                  </p>
                  {formData.description && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
                      {formData.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 — Ranking & Visibility */}
        <section className={sectionCard}>
          <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            <h2 className="font-semibold text-[var(--color-text)]">رتبه‌بندی و نمایش</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              ترتیب و وزن در الگوریتم ترند
            </p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label htmlFor="order" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                ترتیب نمایش
              </label>
              <input
                type="number"
                id="order"
                name="order"
                value={formData.order}
                onChange={handleChange}
                min={0}
                className="w-full max-w-[120px] px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--primary)]"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-1">عدد کوچکتر = نمایش زودتر</p>
            </div>
            <CategoryWeightCard
              value={formData.trendingWeight}
              onChange={(w) => setFormData((p) => ({ ...p, trendingWeight: w }))}
              canEdit={canEditWeight}
            />
            <div className="flex flex-wrap gap-6 pt-2">
              <ToggleRow
                label="Boost موقت"
                checked={formData.boostEnabled}
                onChange={(v) => setFormData((p) => ({ ...p, boostEnabled: v }))}
              />
              <ToggleRow
                label="ویژه"
                checked={formData.featured}
                onChange={(v) => setFormData((p) => ({ ...p, featured: v }))}
              />
              <ToggleRow
                label="نمایش در خانه"
                checked={formData.showInHome}
                onChange={(v) => setFormData((p) => ({ ...p, showInHome: v }))}
              />
              <ToggleRow
                label="نمایش در اکسپلور"
                checked={formData.showInExplore}
                onChange={(v) => setFormData((p) => ({ ...p, showInExplore: v }))}
              />
              <ToggleRow
                label="فعال"
                checked={formData.isActive}
                onChange={(v) => setFormData((p) => ({ ...p, isActive: v }))}
              />
            </div>
          </div>
        </section>

        {/* Section 3 — Engagement Rules */}
        <section className={sectionCard}>
          <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            <h2 className="font-semibold text-[var(--color-text)]">قوانین تعامل</h2>
          </div>
          <div className="p-5 space-y-4">
            <ToggleRow
              label="فعال بودن کامنت‌ها"
              checked={formData.commentsEnabled}
              onChange={(v) => setFormData((p) => ({ ...p, commentsEnabled: v }))}
            />
            <ToggleRow
              label="مودریشن سخت‌گیرانه"
              checked={formData.strictModeration}
              onChange={(v) => setFormData((p) => ({ ...p, strictModeration: v }))}
            />
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                حساسیت پرچم خودکار
              </label>
              <select
                name="autoFlagSensitivity"
                value={formData.autoFlagSensitivity}
                onChange={handleChange}
                className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="low">کم</option>
                <option value="medium">متوسط</option>
                <option value="high">بالا</option>
              </select>
            </div>
          </div>
        </section>

        {/* Category Impact Snapshot — monitoring only */}
        <CategoryImpactCard categoryId={category.id} className="mt-6" />

        {/* Section 4 — Analytics Snapshot */}
        <section className={sectionCard}>
          <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            <h2 className="font-semibold text-[var(--color-text)]">خلاصه آمار</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">فقط نمایش؛ بدون ویرایش</p>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-[var(--color-bg)]">
              <p className="text-xs text-[var(--color-text-muted)]">تعداد لیست‌ها</p>
              <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">
                {analytics.listCount.toLocaleString('fa-IR')}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-bg)]">
              <p className="text-xs text-[var(--color-text-muted)]">رشد ذخیره ۷ روز</p>
              <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">
                {analytics.saveGrowthPercent >= 0 ? '+' : ''}
                {analytics.saveGrowthPercent.toLocaleString('fa-IR')}٪
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-bg)]">
              <p className="text-xs text-[var(--color-text-muted)]">میانگین تعامل</p>
              <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">
                {analytics.engagementRatio.toFixed(1)}٪
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-bg)]">
              <p className="text-xs text-[var(--color-text-muted)]">امتیاز ترند میانگین</p>
              <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">
                {analytics.trendingScoreAvg.toLocaleString('fa-IR')}
              </p>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className={`${sectionCard} border-red-200 bg-red-50/30`}>
          <button
            type="button"
            onClick={() => setDangerOpen((o) => !o)}
            className="w-full px-5 py-4 flex items-center justify-between text-right"
          >
            <span className="font-semibold text-red-800">منطقه خطر</span>
            {dangerOpen ? <ChevronDown className="w-5 h-5 text-red-600" /> : <ChevronUp className="w-5 h-5 text-red-600" />}
          </button>
          {dangerOpen && (
            <div className="px-5 pb-5 pt-0 border-t border-red-200/50">
              <p className="text-sm text-red-800 mt-4">
                این دسته‌بندی در حال حاضر {analytics.listCount.toLocaleString('fa-IR')} لیست دارد.
                حذف فقط زمانی امکان‌پذیر است که هیچ لیستی به این دسته منتسب نباشد.
              </p>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={analytics.listCount > 0 || loading}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                حذف دسته‌بندی
              </button>
            </div>
          )}
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !slugValid}
            className="px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
          <Link
            href="/admin/categories"
            className="px-6 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] font-medium hover:bg-[var(--color-bg)]"
          >
            انصراف
          </Link>
        </div>
      </form>

      {/* Delete confirmation modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl max-w-md w-full p-6 border border-[var(--color-border)]">
            <h3 className="font-semibold text-[var(--color-text)] mb-2">تأیید حذف</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              برای حذف این دسته‌بندی عبارت <strong>حذف</strong> را در کادر زیر وارد کنید.
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
                onClick={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(''); }}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)]"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteConfirmText !== 'حذف' || loading}
                className="px-4 py-2 rounded-xl bg-red-600 text-white disabled:opacity-50"
              >
                {loading ? '...' : 'حذف نهایی'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
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
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
