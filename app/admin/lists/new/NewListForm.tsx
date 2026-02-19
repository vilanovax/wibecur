'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { categories } from '@prisma/client';
import ImageUpload from '@/components/admin/upload/ImageUpload';

interface NewListFormProps {
  categories: categories[];
}

function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function NewListForm({ categories }: NewListFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    coverImage: '',
    categoryId: categories[0]?.id || '',
    badge: '',
    isPublic: true,
    isFeatured: false,
    isActive: true,
  });

  const selectedCategory = categories.find((c) => c.id === formData.categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      router.push(`/admin/lists/${list.id}/edit`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => {
      const nextSlug = slugTouched ? prev.slug : slugFromTitle(title);
      return { ...prev, title, slug: nextSlug };
    });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true);
    setFormData((prev) => ({
      ...prev,
      slug: normalizeSlug(e.target.value),
    }));
  };

  const toggle = useCallback(
    (key: 'isPublic' | 'isFeatured' | 'isActive') => {
      setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    []
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">لیست جدید</h1>
        <Link
          href="/admin/lists"
          className="text-gray-600 hover:text-gray-900"
        >
          بازگشت
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="pb-24">
        <div className="flex flex-col gap-8">
          {/* Block 1: Core Identity */}
          <section
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            aria-labelledby="core-identity-heading"
          >
            <h2
              id="core-identity-heading"
              className="text-lg font-semibold text-gray-900 mb-6"
            >
              هویت اصلی
            </h2>
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  عنوان لیست *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="مثال: بهترین فیلم‌های 2024"
                />
              </div>

              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Slug (نامک) *
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  required
                  dir="ltr"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                  placeholder="مثال: best-movies-2024"
                />
                <p className="text-xs text-gray-500 mt-1">
                  از حروف انگلیسی کوچک، اعداد و خط تیره استفاده کنید. در صورت خالی بودن از عنوان پر می‌شود.
                </p>
              </div>

              <div>
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  دسته‌بندی *
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  توضیحات
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="توضیحات لیست..."
                />
              </div>
            </div>
          </section>

          {/* Block 2: Visual Identity + Live Preview */}
          <section
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            aria-labelledby="visual-identity-heading"
          >
            <h2
              id="visual-identity-heading"
              className="text-lg font-semibold text-gray-900 mb-6"
            >
              هویت بصری
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <ImageUpload
                  value={formData.coverImage}
                  onChange={(url) =>
                    setFormData((prev) => ({ ...prev, coverImage: url }))
                  }
                  label="تصویر کاور"
                />
                <div>
                  <label
                    htmlFor="badge"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    نشان
                  </label>
                  <select
                    id="badge"
                    name="badge"
                    value={formData.badge}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">بدون نشان</option>
                    <option value="TRENDING">Trending (پرطرفدار)</option>
                    <option value="NEW">New (جدید)</option>
                    <option value="FEATURED">Featured (ویژه)</option>
                  </select>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="lg:sticky lg:top-24">
                <p className="text-sm font-medium text-gray-600 mb-3">
                  پیش‌نمایش
                </p>
                <div
                  className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white"
                  style={{ direction: 'rtl' }}
                >
                  <div className="aspect-[2/1] bg-gray-100 relative">
                    {formData.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={formData.coverImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-gray-400"
                        style={{
                          backgroundColor:
                            selectedCategory?.color
                              ? `${selectedCategory.color}20`
                              : undefined,
                        }}
                      >
                        تصویر کاور
                      </div>
                    )}
                    {selectedCategory && (
                      <div
                        className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-md text-white text-xs font-medium shadow"
                        style={{
                          backgroundColor:
                            selectedCategory.color || '#6366F1',
                        }}
                      >
                        <span>{selectedCategory.icon}</span>
                        <span>{selectedCategory.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {formData.title || 'عنوان لیست'}
                    </h3>
                    {formData.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {formData.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Block 3: System Behavior */}
          <section
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            aria-labelledby="system-behavior-heading"
          >
            <h2
              id="system-behavior-heading"
              className="text-lg font-semibold text-gray-900 mb-6"
            >
              رفتار سیستم
            </h2>
            {selectedCategory && (
              <p className="text-sm text-gray-600 mb-4">
                این لیست در دسته‌بندی «{selectedCategory.icon} {selectedCategory.name}» قرار می‌گیرد.
              </p>
            )}
            <div className="space-y-4">
              <ToggleRow
                label="عمومی (قابل مشاهده برای همه)"
                checked={formData.isPublic}
                onToggle={() => toggle('isPublic')}
              />
              <ToggleRow
                label="ویژه (نمایش در صفحه اصلی)"
                checked={formData.isFeatured}
                onToggle={() => toggle('isFeatured')}
              />
              <ToggleRow
                label="فعال"
                checked={formData.isActive}
                onToggle={() => toggle('isActive')}
              />
            </div>
          </section>
        </div>

        {/* Sticky bottom action bar */}
        <div
          className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] py-4 px-4 md:px-6"
          style={{ direction: 'rtl' }}
        >
          <div className="max-w-3xl mx-auto flex gap-3 justify-start">
            <button
              type="submit"
              disabled={loading || !formData.categoryId}
              className="flex-1 max-w-xs bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'در حال ایجاد...' : 'ایجاد لیست'}
            </button>
            <Link
              href="/admin/lists"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              انصراف
            </Link>
          </div>
        </div>
      </form>
    </>
  );
}

function ToggleRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none ${
          checked
            ? 'border-primary bg-primary'
            : 'border-gray-300 bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-[margin] ${
            checked ? 'ms-auto' : 'ms-0.5'
          }`}
        />
      </button>
    </div>
  );
}
