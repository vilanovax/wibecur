'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Pencil, Zap, ChevronDown, Scale, BarChart3, Power } from 'lucide-react';

interface CategoryActionsProps {
  categoryId: string;
  categoryName: string;
}

export default function CategoryActions({ categoryId, categoryName }: CategoryActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2 flex-wrap" dir="rtl" ref={ref}>
      <Link
        href={`/admin/categories/${categoryId}/edit`}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
      >
        <Pencil className="w-4 h-4" />
        ویرایش
      </Link>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-amber-700 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
      >
        <Zap className="w-4 h-4" />
        Boost
      </button>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          بیشتر
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute top-full right-0 mt-1 w-44 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1 z-50 min-w-[11rem]">
            <Link
              href={`/admin/categories/${categoryId}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              onClick={() => setOpen(false)}
            >
              <Scale className="w-4 h-4" />
              تنظیم وزن
            </Link>
            <Link
              href={`/admin/analytics?category=${categoryId}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              onClick={() => setOpen(false)}
            >
              <BarChart3 className="w-4 h-4" />
              آنالیتیکس
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => setOpen(false)}
            >
              <Power className="w-4 h-4" />
              غیرفعال
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
