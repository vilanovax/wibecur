'use client';

import Link from 'next/link';
import { ListPlus, Sparkles } from 'lucide-react';

interface MyListsEmptyStateProps {
  message: string;
  showCreate?: boolean;
  onCreate?: () => void;
}

export default function MyListsEmptyState({
  message,
  showCreate = true,
  onCreate,
}: MyListsEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-wibe bg-wibe-card/60 px-4 py-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ListPlus className="h-8 w-8" strokeWidth={1.75} />
      </div>
      <h3 className="wibe-h3 text-foreground">{message}</h3>
      <p className="mt-2 wibe-small text-wibe-secondary leading-relaxed max-w-[260px] mx-auto">
        اولین لیستت رو بساز و آیتم‌های مورد علاقه‌ات رو جمع کن
      </p>
      {showCreate && (
        <div className="mt-5 flex flex-col items-center gap-2.5">
          {onCreate ? (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-lg wibe-small font-semibold shadow-sm active:scale-[0.98] transition-transform"
            >
              <ListPlus className="w-4 h-4" />
              ایجاد لیست جدید
            </button>
          ) : (
            <Link
              href="/user-lists?openCreate=1"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-lg wibe-small font-semibold shadow-sm active:scale-[0.98] transition-transform"
            >
              <ListPlus className="w-4 h-4" />
              ایجاد لیست جدید
            </Link>
          )}
          <Link
            href="/lists"
            className="inline-flex items-center gap-1 text-primary wibe-caption font-medium hover:underline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            الهام از لیست‌های دیگران
          </Link>
        </div>
      )}
    </div>
  );
}
