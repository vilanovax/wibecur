'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface EditorsPicksProps {
  lists: CategoryListCard[];
  accentColor?: string;
}

/** Editor's Picks — بک‌گراند طلایی، badge ویژه */
export default function EditorsPicks({
  lists,
  accentColor = '#EA580C',
}: EditorsPicksProps) {
  if (lists.length === 0) return null;

  return (
    <section
      className="px-4 py-4 rounded-2xl mx-4 -mx-4"
      style={{
        background: 'linear-gradient(135deg, #fef9e7 0%, #fef3c7 50%, #fde68a 30%)',
        border: '1px solid rgba(251, 191, 36, 0.4)',
      }}
    >
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-1">
        💎 انتخاب سردبیر
      </h2>
      <p className="text-[11px] text-amber-800/80 mb-3">
        لیست‌های ویژه و پیشنهادی
      </p>

      <div className="space-y-2.5">
        {lists.slice(0, 3).map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex gap-3 p-3 rounded-xl bg-white/90 border border-amber-200/60 shadow-sm active:scale-[0.99] transition-transform"
          >
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
              {list.coverImage ? (
                <ImageWithFallback
                  src={list.coverImage}
                  alt={list.title}
                  className="h-full w-full object-cover"
                  placeholderSize="square"
                  sizes="64px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl opacity-50 bg-amber-100">
                  💎
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-200/80 px-1.5 py-0.5 rounded mb-1">
                ویژه
              </span>
              <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                {list.title}
              </h3>
              <p className="text-[10px] text-wibe-secondary mt-0.5">
                {list.creator?.name || 'کیوریتور'} • ⭐ {list.saveCount}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
