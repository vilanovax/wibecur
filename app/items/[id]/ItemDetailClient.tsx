'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CommentSection from '@/components/mobile/comments/CommentSection';
import ItemReportButton from '@/components/mobile/items/ItemReportButton';
import ItemLikeButton from '@/components/mobile/items/ItemLikeButton';
import ItemSaveButton from '@/components/mobile/items/ItemSaveButton';

interface ItemDetailClientProps {
  item: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    externalUrl: string | null;
    rating: number | null;
    voteCount: number | null;
    metadata: any;
    lists: {
      id: string;
      title: string;
      slug: string;
      categories: {
        id: string;
        name: string;
        slug: string;
        icon: string;
        color: string;
      } | null;
    };
    users: {
      name: string | null;
    } | null;
    isLiked?: boolean;
  };
}

export default function ItemDetailClient({ item }: ItemDetailClientProps) {
  return (
    <>
      <main className="space-y-6 pt-4">
        {/* Item Image */}
        <div className="relative h-72 w-full bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 overflow-hidden">
          {item.imageUrl ? (
            <ImageWithFallback
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              fallbackIcon={item.lists.categories?.icon || '📋'}
              fallbackClassName="h-full w-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl opacity-30">
                {item.lists.categories?.icon || '📋'}
              </span>
            </div>
          )}
        </div>

        {/* Item Content */}
        <div className="px-4 space-y-5">
          {/* Back to List Link */}
          <Link
            href={`/lists/${item.lists.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-white border border-gray-200 hover:border-primary hover:bg-gray-50 transition-all shadow-sm"
          >
            <span className="text-lg">{item.lists.categories?.icon || '📋'}</span>
            <span className="text-gray-700">بازگشت به: {item.lists.title}</span>
          </Link>

          {/* Title Section */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {item.title}
            </h1>
            {item.description && (
              <p className="text-gray-600 leading-relaxed text-base">
                {item.description}
              </p>
            )}
          </div>

          {/* External Link */}
          {item.externalUrl && (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30"
            >
              <span>🔗</span>
              <span>اطلاعات بیشتر</span>
            </a>
          )}

          {/* Stats and Actions */}
          <div className="flex items-center justify-between gap-3 pt-2 pb-2 border-t border-gray-100">
            <div className="flex items-center gap-5">
              {item.rating && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-500 text-lg">⭐</span>
                  <span className="text-sm font-semibold text-gray-900">{item.rating}</span>
                </div>
              )}
              <ItemLikeButton
                itemId={item.id}
                initialLikeCount={item.voteCount || 0}
                initialIsLiked={item.isLiked || false}
              />
            </div>
            <div className="flex items-center gap-2">
              <ItemSaveButton itemId={item.id} />
              <ItemReportButton itemId={item.id} />
            </div>
          </div>
        </div>

        {/* Metadata Section */}
        {item.metadata &&
          typeof item.metadata === 'object' &&
          Object.keys(item.metadata).length > 0 && (
            <div className="px-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary rounded-full"></span>
                  اطلاعات تکمیلی
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(
                    item.metadata as Record<string, any>
                  ).map(([key, value]) => {
                    if (!value) return null;

                    const labels: Record<string, string> = {
                      year: 'سال',
                      genre: 'ژانر',
                      director: 'کارگردان',
                      imdbRating: 'امتیاز IMDb',
                      author: 'نویسنده',
                      address: 'آدرس',
                      priceRange: 'بازه قیمت',
                      cuisine: 'نوع غذا',
                      phone: 'تلفن',
                    };

                    const icons: Record<string, string> = {
                      year: '📅',
                      genre: '🎭',
                      director: '🎬',
                      imdbRating: '⭐',
                      author: '✍️',
                      address: '📍',
                      priceRange: '💰',
                      cuisine: '🍽️',
                      phone: '📞',
                    };

                    const displayValue =
                      key === 'priceRange' && typeof value === 'string'
                        ? value.length > 0
                          ? `${value} - ${
                              value === '$'
                                ? 'ارزان'
                                : value === '$$'
                                ? 'متوسط'
                                : value === '$$$'
                                ? 'گران'
                                : 'لوکس'
                            }`
                          : value
                        : value;

                    return (
                      <div key={key} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">{icons[key] || '📋'}</span>
                          <span className="text-xs text-gray-500 font-medium">
                            {labels[key] || key}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 block">
                          {displayValue}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        {/* Comments Section */}
        <div className="px-4">
          <CommentSection itemId={item.id} />
        </div>

        {/* List Info */}
        <div className="px-4 pb-6">
          <Link
            href={`/lists/${item.lists.slug}`}
            className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{item.lists.categories?.icon || '📋'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">از لیست</p>
                <p className="font-semibold text-gray-900 truncate">
                  {item.lists.title}
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </Link>
        </div>
      </main>
    </>
  );
}

