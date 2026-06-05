'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/admin/shared/ImageUpload';
import { catalogCategoryLabel } from '@/lib/catalog-display';
import { ArrowRight } from 'lucide-react';

type CategoryOption = { id: string; name: string; slug: string; icon: string };

type CatalogEditData = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  categorySlug: string | null;
  listCount: number;
};

export default function CatalogEditForm({
  catalog,
  categories,
}: {
  catalog: CatalogEditData;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: catalog.title,
    description: catalog.description ?? '',
    imageUrl: catalog.imageUrl ?? '',
    externalUrl: catalog.externalUrl ?? '',
    categorySlug: catalog.categorySlug ?? '',
  });

  const categoryOptions = useMemo(() => {
    const opts = categories.map((c) => ({
      slug: c.slug,
      label: `${c.icon} ${c.name}`,
    }));
    const current = catalog.categorySlug;
    if (current && !categories.some((c) => c.slug === current)) {
      opts.unshift({
        slug: current,
        label: `${catalogCategoryLabel(current)} (فعلی)`,
      });
    }
    return opts;
  }, [categories, catalog.categorySlug]);

  const categoryChanged = form.categorySlug !== (catalog.categorySlug ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryChanged) {
      const from = catalogCategoryLabel(catalog.categorySlug);
      const to = catalogCategoryLabel(form.categorySlug || null);
      if (
        !confirm(
          `دستهٔ اصلی از «${from}» به «${to}» تغییر می‌کند.\nاین روی همهٔ جایگاه‌های این آیتم اعمال می‌شود. ادامه می‌دهید؟`
        )
      ) {
        return;
      }
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/catalog-items/${catalog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          imageUrl: form.imageUrl,
          externalUrl: form.externalUrl,
          categorySlug: form.categorySlug || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');
      router.push('/admin/catalog');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl pb-20" dir="rtl">
      <Link
        href="/admin/catalog"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-700 mb-4"
      >
        <ArrowRight className="w-4 h-4" />
        بازگشت به کاتالوگ
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">ویرایش آیتم</h1>
      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-6">
        تغییرات روی{' '}
        <strong>{catalog.listCount.toLocaleString('fa-IR')} جایگاه</strong> در لیست‌های مختلف
        اعمال می‌شود.
      </p>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 rounded-xl px-3 py-2 mb-4">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5">
        <div>
          <label htmlFor="categorySlug" className="block text-sm font-semibold mb-1.5">
            دستهٔ اصلی <span className="text-red-500">*</span>
          </label>
          <select
            id="categorySlug"
            required
            value={form.categorySlug}
            onChange={(e) => setForm((p) => ({ ...p, categorySlug: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-violet-500/25"
          >
            <option value="" disabled>
              انتخاب دسته…
            </option>
            {categoryOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1.5">
            نوع محتوا در کل سیستم (فیلم، کتاب، کافه و …) — مستقل از لیستی که آیتم در آن قرار دارد.
          </p>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-semibold mb-1.5">
            عنوان <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold mb-1.5">
            توضیحات
          </label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">تصویر</label>
          <ImageUpload
            value={form.imageUrl}
            onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
            label=""
            title={form.title}
          />
        </div>

        <div>
          <label htmlFor="externalUrl" className="block text-sm font-semibold mb-1.5">
            لینک خارجی
          </label>
          <input
            id="externalUrl"
            type="url"
            value={form.externalUrl}
            onChange={(e) => setForm((p) => ({ ...p, externalUrl: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            dir="ltr"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !form.categorySlug}
          className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm disabled:opacity-50"
        >
          {loading ? 'در حال ذخیره…' : 'ذخیره و همگام‌سازی همهٔ لیست‌ها'}
        </button>
      </form>
    </div>
  );
}
