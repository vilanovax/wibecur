'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Plus, HelpCircle } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import ProfilePicksEditorSheet from './ProfilePicksEditorSheet';
import { PROFILE_PICKS_UPDATED_EVENT } from '@/lib/profile-events';
import { MAX_PICKS_PER_CATEGORY } from '@/lib/profile-picks';
import type { ProfilePickItemDto, ProfilePickShelfDto, ProfilePicksResponse } from '@/lib/profile-picks-types';

interface ProfilePicksSectionProps {
  userId: string;
  isOwner?: boolean;
  initialData?: ProfilePicksResponse | null;
  publicShelves?: ProfilePicksResponse['shelves'];
}

async function fetchProfilePicks(): Promise<ProfilePicksResponse> {
  const res = await fetch('/api/user/profile-picks');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'خطا');
  return json.data as ProfilePicksResponse;
}

const PROFILE_PICKS_HELP_TEXT =
  'شما می‌توانید هر فیلم و سریال و رستوران و آیتمی را که خواستید به علاقه‌مندی‌های شخصی خود اضافه کنید و بعداً در شبکه‌های اجتماعی علایق و سلایق خود را می‌توانید با دیگران به نمایش بگذارید.';

function PickCard({ pick, accentColor }: { pick: ProfilePickItemDto; accentColor: string }) {
  const href = pick.itemId ? `/items/${pick.itemId}` : '#';
  const inner = (
    <div
      className="group relative aspect-[2/3] w-[96px] shrink-0 overflow-hidden rounded-xl bg-gray-100 shadow-sm ring-1 ring-black/5"
      style={{ boxShadow: `0 4px 14px ${accentColor}22` }}
    >
      {pick.imageUrl ? (
        <ImageWithFallback
          src={pick.imageUrl}
          alt={pick.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          fallbackIcon="🎬"
          fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-xl"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-2xl">
          ✨
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-1.5 pb-1.5 pt-8">
        <p className="line-clamp-2 text-start text-[11px] font-semibold leading-snug text-white">
          {pick.title}
        </p>
      </div>
      {pick.note && (
        <span className="absolute start-1.5 top-1.5 rounded-full bg-black/50 px-1 py-0.5 text-[10px] text-white backdrop-blur-sm">
          💬
        </span>
      )}
    </div>
  );

  if (pick.itemId) {
    return (
      <Link href={href} className="block shrink-0 active:scale-[0.97] transition-transform">
        {inner}
      </Link>
    );
  }

  return inner;
}

function AddSlotButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[144px] w-[96px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary/35 bg-primary/[0.04] text-primary transition-all hover:border-primary/50 hover:bg-primary/10 active:scale-[0.97]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
        <Plus className="h-4 w-4" />
      </span>
      <span className="text-[11px] font-medium">افزودن</span>
    </button>
  );
}

function ShelfTabs({
  shelves,
  activeSlug,
  onSelect,
}: {
  shelves: ProfilePickShelfDto[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  if (shelves.length <= 1) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
      {shelves.map((shelf) => {
        const selected = shelf.categorySlug === activeSlug;
        return (
          <button
            key={shelf.categorySlug}
            type="button"
            onClick={() => onSelect(shelf.categorySlug)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all active:scale-[0.98] ${
              selected
                ? 'bg-primary text-white shadow-sm'
                : 'border border-wibe bg-wibe-surface text-foreground hover:border-primary/30'
            }`}
          >
            <span>{shelf.categoryIcon}</span>
            <span className="max-w-[88px] truncate">{shelf.categoryName}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                selected ? 'bg-white/25' : 'bg-primary/10 text-primary'
              }`}
            >
              {shelf.picks.length.toLocaleString('fa-IR')}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ActiveShelfPanel({
  shelf,
  maxPerCategory,
  isOwner,
  onEditCategory,
}: {
  shelf: ProfilePickShelfDto;
  maxPerCategory: number;
  isOwner: boolean;
  onEditCategory: (slug: string) => void;
}) {
  const canAddMore = isOwner && shelf.picks.length < maxPerCategory;

  return (
    <div className="relative min-h-[148px]">
      {shelf.picks.length === 0 ? (
        <div className="flex h-[144px] items-center justify-center rounded-xl border border-dashed border-wibe bg-wibe-surface/50">
          <button
            type="button"
            onClick={() => onEditCategory(shelf.categorySlug)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium text-primary hover:bg-primary/10"
          >
            <Plus className="h-4 w-4" />
            افزودن به {shelf.categoryName}
          </button>
        </div>
      ) : (
        <div className="relative -mx-0.5">
          <div className="flex gap-2 overflow-x-auto px-0.5 pb-0.5 scrollbar-hide" dir="ltr">
            <div className="flex gap-2" style={{ direction: 'rtl' }}>
              {shelf.picks.map((pick) => (
                <PickCard key={pick.id} pick={pick} accentColor={shelf.categoryColor} />
              ))}
              {canAddMore && (
                <AddSlotButton onClick={() => onEditCategory(shelf.categorySlug)} />
              )}
            </div>
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 start-0 w-5 bg-gradient-to-r from-wibe-card to-transparent"
            aria-hidden
          />
        </div>
      )}
    </div>
  );
}

export default function ProfilePicksSection({
  userId,
  isOwner = true,
  initialData = null,
  publicShelves,
}: ProfilePicksSectionProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorCategory, setEditorCategory] = useState<string | undefined>();
  const [activeShelfSlug, setActiveShelfSlug] = useState<string>('');
  const [helpOpen, setHelpOpen] = useState(false);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['user', userId, 'profile-picks'],
    queryFn: fetchProfilePicks,
    enabled: isOwner,
    initialData: initialData ?? undefined,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!isOwner) return;
    const handler = () => void refetch();
    window.addEventListener(PROFILE_PICKS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(PROFILE_PICKS_UPDATED_EVENT, handler);
  }, [isOwner, refetch]);

  const shelves =
    isOwner && data?.shelves ? data.shelves : (publicShelves ?? data?.shelves ?? []);
  const filledShelves = useMemo(
    () => shelves.filter((s) => s.picks.length > 0),
    [shelves]
  );
  const categories = data?.categories ?? initialData?.categories ?? [];
  const maxPerCategory =
    data?.maxPerCategory ?? initialData?.maxPerCategory ?? MAX_PICKS_PER_CATEGORY;

  const displayShelves = filledShelves;

  useEffect(() => {
    if (displayShelves.length === 0) {
      setActiveShelfSlug('');
      return;
    }
    const stillValid = displayShelves.some((s) => s.categorySlug === activeShelfSlug);
    if (!stillValid) {
      setActiveShelfSlug(displayShelves[0].categorySlug);
    }
  }, [displayShelves, activeShelfSlug]);

  const activeShelf = displayShelves.find((s) => s.categorySlug === activeShelfSlug) ?? displayShelves[0];

  const openEditor = (categorySlug?: string) => {
    setEditorCategory(categorySlug);
    setEditorOpen(true);
  };

  const hasAnyPicks = filledShelves.length > 0;
  const totalPicks = filledShelves.reduce((n, s) => n + s.picks.length, 0);
  const showEmptyOwner = isOwner && !isLoading && !hasAnyPicks;

  if (!isOwner && filledShelves.length === 0) return null;

  return (
    <>
      <section className="mb-4 overflow-hidden rounded-2xl border border-wibe bg-wibe-card shadow-sm">
        <div className="border-b border-wibe/60 bg-gradient-to-l from-primary/[0.06] via-transparent to-violet-500/[0.04] px-3.5 py-2.5 lg:px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </span>
              <div className="min-w-0">
                <h2 className="wibe-h3">منتخب‌های من</h2>
                <p className="truncate wibe-caption text-wibe-secondary">
                  {isOwner
                    ? hasAnyPicks
                      ? `${totalPicks.toLocaleString('fa-IR')} آیتم · ${filledShelves.length.toLocaleString('fa-IR')} قفسه`
                      : 'تا ۱۰ آیتم در هر دسته'
                    : `${totalPicks.toLocaleString('fa-IR')} منتخب`}
                </p>
              </div>
            </div>
            {isOwner && (
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openEditor(activeShelf?.categorySlug)}
                  className="rounded-lg bg-primary px-3 py-1.5 wibe-caption font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark active:scale-[0.98]"
                >
                  {hasAnyPicks ? 'مدیریت' : 'شروع کن'}
                </button>
                <button
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-wibe bg-wibe-surface text-wibe-secondary transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary active:scale-[0.97]"
                  aria-label="راهنمای منتخب‌های من"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2.5 p-3 lg:p-3.5">
          {isLoading && !hasAnyPicks && (
            <div className="flex gap-2 overflow-hidden">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-[144px] w-[96px] shrink-0 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          )}

          {showEmptyOwner && (
            <div className="rounded-xl border border-dashed border-primary/20 bg-wibe-surface/50 px-4 py-4 text-center">
              <p className="wibe-small font-semibold text-foreground">
                فیلم، کتاب، کافه — هر کدام تا ۱۰ تا
              </p>
              <button
                type="button"
                onClick={() => openEditor()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 wibe-caption font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                افزودن اولین منتخب
              </button>
            </div>
          )}

          {hasAnyPicks && activeShelf && (
            <>
              <ShelfTabs
                shelves={displayShelves}
                activeSlug={activeShelf.categorySlug}
                onSelect={setActiveShelfSlug}
              />
              <ActiveShelfPanel
                shelf={activeShelf}
                maxPerCategory={maxPerCategory}
                isOwner={isOwner}
                onEditCategory={openEditor}
              />
            </>
          )}
        </div>
      </section>

      {isOwner && (
        <>
          <BottomSheet
            isOpen={helpOpen}
            onClose={() => setHelpOpen(false)}
            title="منتخب‌های من"
            desktopMaxWidth="sm"
          >
            <div className="space-y-4 p-5">
              <p className="wibe-small leading-relaxed text-foreground">{PROFILE_PICKS_HELP_TEXT}</p>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="w-full rounded-lg bg-primary px-4 py-2.5 wibe-small font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                متوجه شدم
              </button>
            </div>
          </BottomSheet>

          <ProfilePicksEditorSheet
            isOpen={editorOpen}
            onClose={() => {
              setEditorOpen(false);
              setEditorCategory(undefined);
            }}
            categories={categories}
            initialCategorySlug={editorCategory}
            maxPerCategory={maxPerCategory}
            onUpdated={() => void refetch()}
          />
        </>
      )}
    </>
  );
}
