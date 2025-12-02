'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { categories, lists, users } from '@prisma/client';

type ListWithRelations = Pick<lists, 
  | 'id'
  | 'title'
  | 'slug'
  | 'description'
  | 'coverImage'
  | 'categoryId'
  | 'userId'
  | 'badge'
  | 'isPublic'
  | 'isFeatured'
  | 'isActive'
  | 'createdAt'
  | 'updatedAt'
  | 'viewCount'
  | 'likeCount'
  | 'saveCount'
  | 'itemCount'
> & {
  categories: Pick<categories, 'id' | 'name' | 'slug' | 'icon' | 'color'>;
  users: Pick<users, 'id' | 'name' | 'email'>;
};

interface ListsPageClientProps {
  lists: ListWithRelations[];
  categories: Pick<categories, 'id' | 'name' | 'slug' | 'icon' | 'color' | 'order' | 'isActive'>[];
}

export default function ListsPageClient({
  lists = [],
  categories = [],
}: ListsPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter out any undefined/null lists and apply filters
  const filteredLists = (lists || []).filter((list): list is ListWithRelations => {
    if (!list) return false;
    const categoryMatch =
      selectedCategory === 'all' || list.categoryId === selectedCategory;
    const statusMatch =
      statusFilter === 'all' ||
      (statusFilter === 'active' && list.isActive) ||
      (statusFilter === 'inactive' && !list.isActive);
    return categoryMatch && statusMatch;
  });

  // Get category counts
  const categoryCounts = categories.map((cat) => ({
    ...cat,
    count: lists.filter((list) => list.categoryId === cat.id).length,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لیست‌ها</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredLists.length} لیست از {lists.length}
          </p>
        </div>
        <Link
          href="/admin/lists/new"
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors font-medium"
        >
          + لیست جدید
        </Link>
      </div>

      {/* Category Chips Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">دسته‌بندی‌ها</h2>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="نمایش گریدی"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="نمایش لیستی"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                همه
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                فعال
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  statusFilter === 'inactive'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                غیرفعال
              </button>
            </div>
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-primary text-white shadow-md scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>🎯</span>
            <span>همه</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {lists.length}
            </span>
          </button>

          {categoryCounts
            .filter((cat) => cat.count > 0)
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={
                  selectedCategory === cat.id
                    ? { backgroundColor: cat.color }
                    : {}
                }
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedCategory === cat.id
                      ? 'bg-white/20'
                      : 'bg-gray-200'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Lists Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLists.map((list) => {
            if (!list) return null;
            return (
              <div
                key={list.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
              >
                {list.coverImage && (
                  <div className="relative h-48">
                    <Image
                      src={list.coverImage}
                      alt={list.title}
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{list.categories.icon}</span>
                      <span className="text-xs text-gray-500">
                        {list.categories.name}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        list.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {list.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{list.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {list.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>📋 {list?.itemCount ?? 0}</span>
                    <span>❤️ {list?.likeCount ?? 0}</span>
                    <span>⭐ {list?.saveCount ?? 0}</span>
                  </div>
                  <Link
                    href={`/admin/lists/${list.id}/edit`}
                    className="block text-center bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    ویرایش
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLists.map((list) => {
            if (!list) return null;
            return (
              <div
                key={list.id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  {list.coverImage && (
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={list.coverImage}
                        alt={list.title}
                        fill
                        className="object-cover"
                        unoptimized={true}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{list.categories.icon}</span>
                      <span className="text-xs text-gray-500">
                        {list.categories.name}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          list.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {list.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{list.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-1">
                      {list.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📋 {list?.itemCount ?? 0} آیتم</span>
                      <span>❤️ {list?.likeCount ?? 0} لایک</span>
                      <span>⭐ {list?.saveCount ?? 0} ذخیره</span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/lists/${list.id}/edit`}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium whitespace-nowrap"
                  >
                    ویرایش
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredLists.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-500">
            {lists.length === 0
              ? 'هنوز لیستی ایجاد نشده است'
              : 'لیستی با فیلترهای انتخابی یافت نشد'}
          </p>
        </div>
      )}
    </div>
  );
}
