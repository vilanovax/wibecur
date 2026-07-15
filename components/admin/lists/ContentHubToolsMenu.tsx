'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronDown, FileJson, ImageIcon, MoreHorizontal, Plus, Sparkles } from 'lucide-react';

interface ContentHubToolsMenuProps {
  showNewList?: boolean;
}

export default function ContentHubToolsMenu({ showNewList = false }: ContentHubToolsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-[var(--color-border-muted)] text-[var(--color-text)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
        ابزارها
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[12.5rem] rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] py-1 shadow-lg">
          {showNewList && (
            <Link
              href="/admin/lists/new"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
            >
              <Plus className="w-4 h-4" />
              لیست جدید
            </Link>
          )}
          <Link
            href="/admin/lists?view=import"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
          >
            <FileJson className="w-4 h-4" />
            import گروهی
          </Link>
          <Link
            href="/admin/catalog/storage-images"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
          >
            <ImageIcon className="w-4 h-4" />
            تصاویر
          </Link>
          <Link
            href="/admin/books/extract"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
          >
            <BookOpen className="w-4 h-4" />
            استخراج کتاب
          </Link>
          <Link
            href="/admin/custom/featured"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
          >
            <Sparkles className="w-4 h-4" />
            Featured
          </Link>
        </div>
      )}
    </div>
  );
}
