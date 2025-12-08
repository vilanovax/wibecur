'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { categories, lists, items } from '@prisma/client';
import ImageUpload from '@/components/admin/upload/ImageUpload';

interface EditListFormProps {
  list: lists & {
    categories: categories | null;
    items: items[];
  };
  categories: categories[];
}

export default function EditListForm({ list, categories }: EditListFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/lists/${list.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'خطا در ویرایش لیست');
      }

      // Go back to previous page
      router.back();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'آیا از حذف این لیست و تمام آیتم‌های آن اطمینان دارید؟ این عمل قابل برگشت نیست.'
      )
    ) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/lists/${list.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'خطا در حذف لیست');
      }

      // Go back to previous page (or lists page if no previous page)
      router.push('/admin/lists');
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
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">ویرایش لیست</h1>
        <Link href="/admin/lists" className="text-gray-600 hover:text-gray-900">
          بازگشت
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="space-y-6">
              {/* Title */}
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
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Slug */}
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
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  از حروف انگلیسی کوچک، اعداد و خط تیره استفاده کنید
                </p>
              </div>

              {/* Category */}
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
                   value={formData.categoryId || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="توضیحات لیست..."
                />
              </div>

              {/* Cover Image */}
              <ImageUpload
                value={formData.coverImage}
                onChange={(url) =>
                  setFormData((prev) => ({ ...prev, coverImage: url }))
                }
                label="تصویر کاور"
              />

              {/* Badge */}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">بدون نشان</option>
                  <option value="TRENDING">Trending (پرطرفدار)</option>
                  <option value="NEW">New (جدید)</option>
                  <option value="FEATURED">Featured (ویژه)</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isPublic: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label
                    htmlFor="isPublic"
                    className="mr-2 text-sm font-medium text-gray-700"
                  >
                    عمومی (قابل مشاهده برای همه)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isFeatured: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label
                    htmlFor="isFeatured"
                    className="mr-2 text-sm font-medium text-gray-700"
                  >
                    ویژه (نمایش در صفحه اصلی)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label
                    htmlFor="isActive"
                    className="mr-2 text-sm font-medium text-gray-700"
                  >
                    فعال
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
              <Link
                href="/admin/lists"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                انصراف
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                حذف
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar - Items */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              آیتم‌ها ({list.items.length})
            </h2>
            {list.items.length > 0 ? (
              <div className="space-y-3">
                {list.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3 bg-gray-50 rounded-lg text-sm"
                  >
                    <div className="font-medium text-gray-900">
                      {index + 1}. {item.title}
                    </div>
                    {item.description && (
                      <div className="text-gray-600 text-xs mt-1 line-clamp-2">
                        {item.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">هنوز آیتمی اضافه نشده است</p>
            )}
            <Link
              href={`/admin/items?listId=${list.id}`}
              className="block mt-4 text-center bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              مدیریت آیتم‌ها
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
