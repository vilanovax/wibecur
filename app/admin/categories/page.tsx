import { requireAdmin } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function CategoriesPage() {
  await requireAdmin();

  const categories = await dbQuery(() =>
    prisma.categories.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { lists: true },
        },
      },
    })
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">دسته‌بندی‌ها</h1>
        <Link
          href="/admin/categories/new"
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          + دسته‌بندی جدید
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                آیکون
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                نام
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                Slug
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                تعداد لیست
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                وضعیت
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="text-3xl">{cat.icon}</span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                <td className="px-6 py-4 text-gray-500">{cat.slug}</td>
                <td className="px-6 py-4 text-gray-500">{cat._count.lists}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      cat.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {cat.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/categories/${cat.id}/edit`}
                    className="text-primary hover:text-primary-dark ml-4"
                  >
                    ویرایش
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
