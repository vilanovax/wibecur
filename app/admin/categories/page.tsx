import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Pagination from '@/components/admin/shared/Pagination';
import { Suspense } from 'react';

const ITEMS_PER_PAGE = 20;

function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
          <div className="flex justify-between">
            <div className="h-6 bg-gray-200 rounded w-16"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function CategoriesContent({
  currentPage,
}: {
  currentPage: number;
}) {
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const [totalCount, categories, listCounts] = await Promise.all([
    prisma.categories.count(),
    prisma.categories.findMany({
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true,
        description: true,
        order: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.lists.groupBy({
      by: ['categoryId'],
      _count: {
        categoryId: true,
      },
    }),
  ]);

  const listCountMap = new Map(
    listCounts.map((item) => [item.categoryId, item._count.categoryId])
  );

  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    listCount: listCountMap.get(cat.id) || 0,
  }));

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const totalLists = listCounts.reduce((sum, item) => sum + item._count.categoryId, 0);
  const activeCount = categories.filter(c => c.isActive).length;

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">کل دسته‌بندی‌ها</p>
              <p className="text-3xl font-bold">{totalCount}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm mb-1">دسته‌بندی‌های فعال</p>
              <p className="text-3xl font-bold">{activeCount}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">مجموع لیست‌ها</p>
              <p className="text-3xl font-bold">{totalLists}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categoriesWithCount.map((cat) => (
          <div
            key={cat.id}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1"
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-sm"
                style={{
                  backgroundColor: cat.color ? `${cat.color}15` : '#f3f4f6',
                  color: cat.color || '#6b7280'
                }}
              >
                {cat.icon || '📁'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-gray-400 font-mono truncate">{cat.slug}</p>
              </div>
            </div>

            {/* Description */}
            {cat.description && (
              <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm font-medium text-gray-600">{cat.listCount} لیست</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <span className="text-sm font-medium text-gray-600">ترتیب: {cat.order}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  cat.isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cat.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                {cat.isActive ? 'فعال' : 'غیرفعال'}
              </span>
              <Link
                href={`/admin/categories/${cat.id}/edit`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                ویرایش
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {categoriesWithCount.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">دسته‌بندی‌ای وجود ندارد</h3>
          <p className="text-gray-500 mb-6">اولین دسته‌بندی خود را ایجاد کنید</p>
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            ایجاد دسته‌بندی
          </Link>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/categories"
      />
    </>
  );
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();

  const { page = '1' } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-l from-amber-500 via-orange-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">مدیریت دسته‌بندی‌ها</h1>
            <p className="text-white/80">
              دسته‌بندی‌های لیست‌ها را مدیریت کنید و سازماندهی محتوا را بهبود دهید.
            </p>
          </div>
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl transition-all duration-300 hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            دسته‌بندی جدید
          </Link>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesContent currentPage={currentPage} />
      </Suspense>
    </div>
  );
}
