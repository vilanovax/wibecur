'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ExternalLink, Bug, Trash2 } from 'lucide-react';
import ImageUpload from '@/components/admin/upload/ImageUpload';
import type { ListTrendingDebugData } from '@/lib/admin/trending-debug';

type ListEdit = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  categoryId: string | null;
  badge: string | null;
  isPublic: boolean;
  isFeatured: boolean;
  isActive: boolean;
  saveCount: number;
  viewCount: number;
  itemCount: number;
  categories: { id: string; name: string; slug: string; icon: string; color: string } | null;
  users: { id: string; name: string; email: string; username: string | null } | null;
  items: Array<{ id: string; title: string; description: string | null; order: number }>;
};
type Category = { id: string; name: string; slug: string; icon: string; color: string };

interface EditListFormProps {
  list: ListEdit;
  categories: Category[];
  intelligence: (ListTrendingDebugData & { list?: { createdAt?: string } }) | null;
}

const STATUS_BADGE = {
  rising: { label: 'صعودی', className: 'bg-emerald-100 text-emerald-800' },
  stable: { label: 'ثابت', className: 'bg-amber-100 text-amber-800' },
  declining: { label: 'نزولی', className: 'bg-red-100 text-red-800' },
};

export default function EditListForm({ list, categories, intelligence }: EditListFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dangerOpen, setDangerOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [formData, setFormData] = useState({
    title: list.title,
    slug: list.slug,
    description: list.description || '',
    coverImage: list.coverImage || '',
    categoryId: list.categoryId,
    badge: list.badge || '',
    isPublic: list.isPublic,
    isFeatured: list.isFeatured,
    isActive: list.isActive,
  });
  const [items, setItems] = useState(list.items.map((i) => ({ ...i })));

  const raw = intelligence?.rawMetrics;
  const itemCount = items.length;
  const avgSavesPerItem = itemCount > 0 ? (list.saveCount / itemCount).toFixed(1) : '۰';
  const owner = list.users;
  const ownerLink = owner?.username ? `/u/${owner.username}` : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      router.back();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'حذف') return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/lists/${list.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'خطا در حذف لیست');
      }
      router.push('/admin/lists');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setItems(newItems);
    const updates = newItems.map((item, i) =>
      fetch(`/api/admin/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: i }),
      })
    );
    await Promise.all(updates);
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('این آیتم حذف شود؟')) return;
    try {
      const res = await fetch(`/api/admin/items/${itemId}`, { method: 'DELETE' });
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (_) {}
  };

  const duplicateTitles = items
    .map((i) => i.title?.trim().toLowerCase())
    .filter((t, i, arr) => t && arr.indexOf(t) !== i);
  const hasDuplicate = duplicateTitles.length > 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <Link href="/admin/lists" className="hover:text-[var(--primary)]">لیست‌ها</Link>
        <span>/</span>
        <span className="text-[var(--color-text)]">ویرایش</span>
      </div>

      {/* SECTION 1 — Intelligence Header Bar */}
      <div className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-4 gap-y-3">
          <span className="text-sm text-[var(--color-text-muted)]">
            رتبه: <strong className="text-[var(--color-text)]">{intelligence?.currentRank != null ? `#${intelligence.currentRank}` : '—'}</strong>
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">
            امتیاز ترند: <strong className="text-[var(--primary)]">{intelligence?.scoreBreakdown?.finalScore ?? '—'}</strong>
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">
            ۲۴h: <strong className="text-emerald-600">+{raw?.saves24h ?? 0}</strong>
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">
            ذخیره کل: <strong className="text-[var(--color-text)]">{list.saveCount.toLocaleString('fa-IR')}</strong>
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">
            مالک:{' '}
            {ownerLink ? (
              <Link href={ownerLink} className="font-medium text-[var(--primary)] hover:underline">
                {owner?.name || owner?.email || '—'}
              </Link>
            ) : (
              <span className="text-[var(--color-text)]">{owner?.name || owner?.email || '—'}</span>
            )}
          </span>
          {intelligence?.status && (
            <span className={`text-xs px-2 py-1 rounded-lg font-medium ${STATUS_BADGE[intelligence.status]?.className ?? 'bg-gray-100'}`}>
              {STATUS_BADGE[intelligence.status]?.label ?? intelligence.status}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/admin/lists/${list.id}/debug`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
          >
            <Bug className="w-4 h-4" />
            دیباگ ترند
          </Link>
          <a
            href={`/lists/${list.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-border)]"
          >
            <ExternalLink className="w-4 h-4" />
            صفحه عمومی
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column: Basic Info + Visibility + Image + Danger */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 2 — Basic Info */}
            <div className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">اطلاعات پایه</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">عنوان لیست *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Slug *</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <p className="text-xs text-[var(--color-text-subtle)] mt-0.5">حروف کوچک، اعداد و خط تیره</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">دسته‌بندی *</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">توضیحات</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="توضیحات لیست..."
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3 — Visibility & Status */}
            <div className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">نمایش و وضعیت</h2>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData((p) => ({ ...p, isPublic: e.target.checked }))}
                    className="rounded border-[var(--color-border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--color-text)]">عمومی</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData((p) => ({ ...p, isFeatured: e.target.checked }))}
                    className="rounded border-[var(--color-border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--color-text)]">ویژه (صفحه اصلی)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                    className="rounded border-[var(--color-border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--color-text)]">فعال</span>
                </label>
              </div>
            </div>

            {/* Badge + Cover (compact) */}
            <div className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">نشان</label>
                  <select
                    name="badge"
                    value={formData.badge}
                    onChange={(e) => setFormData((p) => ({ ...p, badge: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                  >
                    <option value="">بدون نشان</option>
                    <option value="TRENDING">Trending</option>
                    <option value="NEW">New</option>
                    <option value="FEATURED">Featured</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">تصویر کاور</label>
                  <ImageUpload
                    value={formData.coverImage}
                    onChange={(url) => setFormData((p) => ({ ...p, coverImage: url }))}
                    label=""
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
              <Link
                href="/admin/lists"
                className="px-6 py-2.5 rounded-2xl font-medium border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg)]"
              >
                انصراف
              </Link>
            </div>
          </form>

          {/* SECTION 6 — Danger Zone */}
          <div className="rounded-2xl border border-red-200 bg-red-50/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setDangerOpen((o) => !o)}
              className="w-full flex items-center justify-between px-6 py-4 text-right text-red-800 font-medium"
            >
              <span>منطقه خطر</span>
              {dangerOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {dangerOpen && (
              <div className="px-6 pb-6 pt-0 border-t border-red-200">
                <p className="text-sm text-red-700 mb-2">
                  با حذف این لیست، <strong>{list.saveCount.toLocaleString('fa-IR')} ذخیره</strong> و تمام آیتم‌ها حذف می‌شوند. این عمل قابل برگشت نیست.
                </p>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="برای تأیید بنویسید: حذف"
                  className="w-full max-w-xs px-3 py-2 rounded-xl border border-red-300 mb-3"
                />
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading || deleteConfirm !== 'حذف'}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف لیست
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Performance Snapshot + Items Panel */}
        <div className="space-y-6">
          {/* SECTION 4 — Performance Snapshot */}
          <div className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">خلاصه عملکرد</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">تعداد آیتم</dt>
                <dd className="font-medium tabular-nums">{itemCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">میانگین ذخیره به آیتم</dt>
                <dd className="font-medium tabular-nums">{avgSavesPerItem}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">نسبت درگیری (٪)</dt>
                <dd className="font-medium tabular-nums">{raw?.engagementRatio ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">سن (روز)</dt>
                <dd className="font-medium tabular-nums">{raw?.ageDays ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">کاهش (Decay)</dt>
                <dd className="font-medium tabular-nums text-red-600">-{intelligence?.scoreBreakdown?.decay ?? '—'}</dd>
              </div>
            </dl>
          </div>

          {/* SECTION 5 — Items Panel */}
          <div className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-card)]">
            <div className="px-4 py-3 border-b border-[var(--color-border-muted)] flex items-center justify-between sticky top-0 bg-[var(--color-surface)] z-10">
              <h2 className="text-base font-semibold text-[var(--color-text)]">
                آیتم‌ها <span className="text-[var(--color-text-muted)] font-normal">({items.length})</span>
              </h2>
              <Link
                href={`/admin/items?listId=${list.id}`}
                className="text-sm font-medium text-[var(--primary)] hover:underline"
              >
                مدیریت آیتم‌ها
              </Link>
            </div>
            {hasDuplicate && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
                عنوان تکراری وجود دارد؛ بررسی کنید.
              </div>
            )}
            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">هنوز آیتمی اضافه نشده است.</p>
              ) : (
                items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-muted)]"
                  >
                    <span className="text-xs text-[var(--color-text-muted)] w-6 tabular-nums">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--color-text)] truncate">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">{item.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      ذخیره کل لیست: {list.saveCount.toLocaleString('fa-IR')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-border)] disabled:opacity-40"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveItem(index, 'down')}
                        disabled={index === items.length - 1}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-border)] disabled:opacity-40"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-600"
                        title="حذف آیتم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
