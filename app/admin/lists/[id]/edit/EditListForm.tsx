'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import ListCoverImageFields from '@/components/admin/lists/ListCoverImageFields';
import type { ListTrendingDebugData } from '@/lib/admin/trending-debug';
import ListFormIdentity from '@/components/admin/lists/ListFormIdentity';
import ListFormStickyPreview from '@/components/admin/lists/ListFormStickyPreview';
import ListEditFormBar from '@/components/admin/lists/ListEditFormBar';
import ListEditHeaderActions from '@/components/admin/lists/ListEditHeaderActions';
import ListEditIntelligenceBar from '@/components/admin/lists/ListEditIntelligenceBar';
import ListEditItemsPanel from '@/components/admin/lists/ListEditItemsPanel';
import ListEditStatusToggles from '@/components/admin/lists/ListEditStatusToggles';
import ListEditFormStepper, { type ListEditFormStep } from '@/components/admin/lists/ListEditFormStepper';
import MoveToTrashModal from '@/components/admin/lists/MoveToTrashModal';
import type { ListIntelligenceRow } from '@/lib/admin/lists-intelligence';
import { slugFromTitle, normalizeListSlug, isValidListSlug } from '@/lib/admin/list-slug';
import {
  buildSlugFromListTitle,
  generateListDescriptionWithAi,
  resolveAvailableListSlug,
} from '@/lib/admin/list-form-quick-actions';
import { useListSlugCheck } from '@/hooks/useListSlugCheck';
import Toast, { type ToastType } from '@/components/shared/Toast';

type ListEdit = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  horizontalImage: string | null;
  categoryId: string | null;
  badge: string | null;
  isPublic: boolean;
  isFeatured: boolean;
  isActive: boolean;
  commentsEnabled: boolean;
  saveCount: number;
  viewCount: number;
  itemCount: number;
  categories: { id: string; name: string; slug: string; icon: string; color: string } | null;
  users: { id: string; name: string; email: string; username: string | null } | null;
  items: Array<{ id: string; title: string; description: string | null; order: number }>;
};
type Category = { id: string; name: string; slug: string; icon: string; color: string };

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

function buildInitialForm(list: ListEdit): FormState {
  return {
    title: list.title,
    slug: list.slug,
    description: list.description || '',
    coverImage: list.coverImage || '',
    horizontalImage: list.horizontalImage || '',
    categoryId: list.categoryId || '',
    badge: list.badge || '',
    isPublic: list.isPublic,
    isFeatured: list.isFeatured,
    isActive: list.isActive,
    commentsEnabled: list.commentsEnabled ?? true,
  };
}

interface EditListFormProps {
  list: ListEdit;
  categories: Category[];
  intelligence: (ListTrendingDebugData & { list?: { createdAt?: string } }) | null;
}

const sectionCard =
  'rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden';

export default function EditListForm({ list, categories, intelligence }: EditListFormProps) {
  const router = useRouter();
  const initialForm = useMemo(() => buildInitialForm(list), [list]);
  const [formData, setFormData] = useState<FormState>(initialForm);
  const [baseline, setBaseline] = useState<FormState>(initialForm);
  const [slugAutoMode, setSlugAutoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [quickFillLoading, setQuickFillLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [step, setStep] = useState<ListEditFormStep>(1);

  const slugChanged = formData.slug !== list.slug;
  const slugValid = useMemo(() => isValidListSlug(formData.slug), [formData.slug]);
  const { state: slugCheck, isSlugBlocked } = useListSlugCheck(formData.slug, {
    excludeId: list.id,
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

  const selectedCategory = categories.find((c) => c.id === formData.categoryId) || list.categories;
  const owner = list.users;
  const ownerLink = owner?.username ? `/u/${owner.username}` : null;
  const ownerName = owner?.name || owner?.email || '—';

  const raw = intelligence?.rawMetrics;
  const itemCount = list.items.length;
  const avgSavesPerItem = itemCount > 0 ? (list.saveCount / itemCount).toFixed(1) : '۰';

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
    itemCount,
  };

  const step1Valid =
    formData.title.trim().length > 0 &&
    slugValid &&
    !!formData.categoryId &&
    (!slugChanged || slugCheck.status === 'available');

  const completedThrough: ListEditFormStep =
    step >= 3 ? 3 : step >= 2 && step1Valid ? 2 : step1Valid ? 1 : 1;

  const trashRow: ListIntelligenceRow = useMemo(
    () => ({
      id: list.id,
      title: formData.title,
      slug: formData.slug,
      description: formData.description || null,
      coverImage: formData.coverImage || null,
      horizontalImage: formData.horizontalImage || null,
      categoryId: formData.categoryId,
      categoryName: selectedCategory?.name ?? '—',
      categorySlug: selectedCategory?.slug ?? null,
      categoryIcon: selectedCategory?.icon ?? '📋',
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
      saveCount: list.saveCount,
      viewCount: list.viewCount,
      likeCount: 0,
      itemCount,
      createdAt: new Date().toISOString(),
      rank: intelligence?.currentRank ?? 0,
      trendingScore: intelligence?.scoreBreakdown?.finalScore ?? 0,
      saves24h: raw?.saves24h ?? 0,
      saves7d: 0,
      growth7dRecent: 0,
      growth7dPrevious: 0,
      status: intelligence?.status ?? 'stable',
      engagementRatio: raw?.engagementRatio ?? 0,
      riskLevel: 'none',
      growth7dPercent: 0,
      needsReview: false,
      lowEngagement: false,
      ownerId: owner?.id ?? '',
      ownerName,
      ownerUsername: owner?.username ?? null,
    }),
    [formData, list, selectedCategory, intelligence, raw, itemCount, owner, ownerName]
  );

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
      const slug = await resolveAvailableListSlug(base, list.id);
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
  }, [formData.title, list.id]);

  const applyGeneratedDescription = useCallback(async () => {
    if (!formData.title.trim() || !selectedCategory) {
      setToast({ message: 'عنوان و دسته الزامی است', type: 'error' });
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
      const slug = await resolveAvailableListSlug(base, list.id);
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
  }, [formData.title, selectedCategory, list.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slugReady || !formData.categoryId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/lists/${list.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'خطا در ویرایش لیست');
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

  const handleMoveToTrash = async (id: string, reason?: string) => {
    const res = await fetch(`/api/admin/lists/${id}/trash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || null }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'خطا');
    setToast({ message: 'لیست به زباله‌دان منتقل شد', type: 'success' });
    router.push('/admin/lists');
    router.refresh();
  };

  return (
    <div className="space-y-4 pb-4" dir="rtl">
      {/* هدر */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/admin/lists"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--primary)] mb-2"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            بازگشت به لیست‌ها
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-text)]">ویرایش لیست</h1>
          <p className="text-sm text-[var(--color-text-muted)] truncate mt-0.5">{list.title}</p>
        </div>
        <ListEditHeaderActions
          listId={list.id}
          listSlug={formData.slug}
          isFeatured={formData.isFeatured}
          categoryId={formData.categoryId}
          onFeaturedChange={(v) => setFormData((p) => ({ ...p, isFeatured: v }))}
        />
      </header>

      <ListEditIntelligenceBar
        intelligence={intelligence}
        saveCount={list.saveCount}
        itemCount={itemCount}
        avgSavesPerItem={avgSavesPerItem}
        ownerName={ownerName}
        ownerLink={ownerLink}
      />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
        <form id="list-edit-form" onSubmit={handleSubmit} className="space-y-4 min-w-0">
          <ListEditFormStepper
            current={step}
            completedThrough={completedThrough}
            onStepClick={(s) => {
              if (s === 1) setStep(1);
              if (s === 2 && step1Valid) setStep(2);
              if (s === 3 && step1Valid) setStep(3);
            }}
          />

          {/* پیش‌نمایش موبایل */}
          <div className="lg:hidden">
            <ListFormStickyPreview values={previewValues} step={step} />
          </div>

          {slugChanged && step === 1 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-2 text-sm text-amber-900">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                با تغییر slug، لینک{' '}
                <span className="font-mono text-xs" dir="ltr">
                  /lists/{list.slug}
                </span>{' '}
                دیگر کار نمی‌کند.
              </p>
            </div>
          )}

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
                  categories={categories}
                  onChange={(patch) => setFormData((p) => ({ ...p, ...patch }))}
                  onTitleChange={handleTitleChange}
                  onSlugChange={handleSlugChange}
                  slugAutoMode={slugAutoMode}
                  onResetSlugAuto={() => setSlugAutoMode((m) => !m)}
                  slugCheck={slugChanged ? slugCheck : { status: 'available', slug: formData.slug }}
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
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">انتشار، Featured و تعامل</p>
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
                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">نشان</label>
                    <select
                      value={formData.badge}
                      onChange={(e) => setFormData((p) => ({ ...p, badge: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm"
                    >
                      <option value="">بدون نشان</option>
                      <option value="TRENDING">Trending</option>
                      <option value="NEW">New</option>
                      <option value="FEATURED">Featured</option>
                    </select>
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

          {step === 3 && <ListEditItemsPanel listId={list.id} initialItems={list.items} />}

          <ListEditFormBar
            loading={loading}
            canSave={slugReady && !isSlugBlocked}
            listSlug={formData.slug}
            dirty={dirty}
            step={step}
            canNextStep={step === 1 ? step1Valid : true}
            onPrevStep={() => setStep((s) => (s > 1 ? ((s - 1) as ListEditFormStep) : s))}
            onNextStep={() => {
              if (step === 1 && !step1Valid) return;
              if (step < 3) setStep((s) => (s + 1) as ListEditFormStep);
            }}
          />
        </form>

        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <ListFormStickyPreview values={previewValues} step={step} />
          </div>
        </aside>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setDangerOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-right text-red-800 font-medium text-sm"
        >
          <span>منطقه خطر</span>
          {dangerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {dangerOpen && (
          <div className="px-4 pb-4 pt-0 border-t border-red-200">
            <p className="text-sm text-red-700 mb-3 mt-3">
              انتقال به زباله‌دان — <strong>{list.saveCount.toLocaleString('fa-IR')} ذخیره</strong> و آیتم‌ها موقتاً
              مخفی می‌شوند.
            </p>
            <button
              type="button"
              onClick={() => setTrashOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700"
            >
              انتقال به زباله‌دان
            </button>
          </div>
        )}
      </div>

      <MoveToTrashModal
        row={trashOpen ? trashRow : null}
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        onConfirm={handleMoveToTrash}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={3500} />
      )}
    </div>
  );
}
