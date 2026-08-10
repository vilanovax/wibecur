'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import CreateListForm from '@/components/mobile/user-lists/CreateListForm';

const CREATE_LIST_CATEGORIES: { icon: string; label: string; slug: string }[] = [
  { icon: '🎬', label: 'فیلم و سریال', slug: 'movie' },
  { icon: '📚', label: 'کتاب', slug: 'book' },
  { icon: '🍽', label: 'رستوران', slug: 'cafe' },
  { icon: '✈️', label: 'سفر', slug: 'travel' },
  { icon: '✨', label: 'ترکیبی', slug: 'mixed' },
];

interface CreateSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreateActionCard({
  href,
  icon,
  title,
  description,
  isPrimary,
  onClose,
  animateOnOpen,
  disabled,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  isPrimary?: boolean;
  onClose: () => void;
  animateOnOpen?: boolean;
  disabled?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (animateOnOpen) {
      setMounted(false);
      const t = setTimeout(() => setMounted(true), 80);
      return () => clearTimeout(t);
    }
    setMounted(false);
  }, [animateOnOpen]);

  return (
    <Link
      href={href}
      onClick={onClose}
      className={`
        flex items-center gap-3 p-4 rounded-2xl text-right transition-colors duration-200
        active:scale-[0.98] active:transition-none
        ${animateOnOpen ? 'origin-center transition-transform duration-300' : ''}
        ${animateOnOpen && !mounted ? 'scale-[0.98] opacity-90' : ''}
        ${disabled ? 'pointer-events-none opacity-50' : ''}
        ${isPrimary
          ? 'bg-primary/5 hover:bg-primary/10'
          : 'bg-wibe-surface/80 hover:bg-wibe-surface'
        }
      `}
    >
      <span className="text-2xl flex-shrink-0 leading-none" aria-hidden>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-foreground block">{title}</span>
        <span className="text-sm text-wibe-secondary mt-0.5 block">{description}</span>
      </div>
    </Link>
  );
}

export default function CreateSheet({ isOpen, onClose }: CreateSheetProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [categoryHint, setCategoryHint] = useState<string | null>(null);

  const isOnListDetail =
    pathname?.startsWith('/lists/') &&
    pathname !== '/lists' &&
    pathname.split('/').length >= 3;
  const listSlug = isOnListDetail ? pathname?.split('/')[2] : null;

  // Reset wizard when the host sheet closes from outside
  useEffect(() => {
    if (!isOpen) {
      setExpanded(false);
      setCreateFormOpen(false);
      setCategoryHint(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setExpanded(false);
    setCreateFormOpen(false);
    setCategoryHint(null);
    onClose();
  };

  const handleCategorySelect = (slug: string) => {
    setCategoryHint(slug);
    setExpanded(false);
    setCreateFormOpen(true);
  };

  const handleCreateFormClose = () => {
    setCreateFormOpen(false);
    setCategoryHint(null);
    onClose();
  };

  // Chooser stays mounted underneath only while form is closed — form is the next step in-place.
  const chooserOpen = isOpen && !createFormOpen;

  return (
    <>
      <BottomSheet
        isOpen={chooserOpen}
        onClose={handleClose}
        title="✨ وایب جدید بساز"
        subtitle="یه لیست بساز یا چیزی به دنیای وایب اضافه کن"
        maxHeight={expanded ? '65vh' : '55vh'}
      >
        <div className="flex flex-col gap-5 px-4 pb-6 pt-1">
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="
                flex w-full origin-center items-center gap-3 rounded-2xl bg-primary/5
                p-4 text-right transition duration-200
                hover:bg-primary/10 active:scale-[0.98]
              "
            >
              <span className="text-2xl flex-shrink-0 leading-none" aria-hidden>
                🧩
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-foreground block">ساخت لیست جدید</span>
                <span className="text-sm text-wibe-secondary mt-0.5 block">
                  لیست شخصی خودتو بساز و منتشر کن
                </span>
              </div>
            </button>
          ) : (
            <div
              className="
                rounded-2xl border border-primary/15 bg-primary/5 shadow-sm
                overflow-hidden transition-colors duration-200
              "
            >
              <div className="flex items-center gap-3 p-4 pb-3">
                <span className="text-2xl flex-shrink-0 leading-none">🧩</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-foreground block">ساخت لیست جدید</span>
                  <span className="text-sm text-wibe-secondary mt-0.5 block">
                    یه حال‌وهوا انتخاب کن
                  </span>
                </div>
              </div>
              <div className="px-4 pb-4 flex flex-wrap gap-3">
                {CREATE_LIST_CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => handleCategorySelect(cat.slug)}
                    className="
                      inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl
                      bg-white border border-wibe text-sm font-medium text-foreground
                      hover:bg-wibe-surface hover:border-primary/30 active:scale-[0.98]
                      transition-colors duration-200
                    "
                  >
                    <span aria-hidden>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <CreateActionCard
            href={listSlug ? `/lists/${listSlug}?suggest=1` : '/explore'}
            icon="➕"
            title={isOnListDetail ? 'پیشنهاد آیتم به این لیست' : 'اضافه کردن آیتم'}
            description={
              isOnListDetail
                ? 'یه آیتم به این لیست پیشنهاد بده'
                : 'یه فیلم، کتاب یا کافه جدید اضافه کن'
            }
            onClose={handleClose}
            disabled={expanded}
          />
          <CreateActionCard
            href="/lists"
            icon="⭐"
            title="ذخیره از لیست‌های آماده"
            description="از لیست‌های آماده وایب انتخاب کن"
            onClose={handleClose}
            disabled={expanded}
          />
        </div>
      </BottomSheet>

      <CreateListForm
        isOpen={isOpen && createFormOpen}
        onClose={handleCreateFormClose}
        categoryHint={categoryHint}
      />
    </>
  );
}
