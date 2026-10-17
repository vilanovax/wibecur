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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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

function PickCard({ pick }: { pick: ProfilePickItemDto }) {
  const href = pick.itemId ? `/items/${pick.itemId}` : '#';
  const inner = (
    <div className="group relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
      {pick.imageUrl ? (
        <ImageWithFallback
          src={pick.imageUrl}
          alt={pick.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          fallbackIcon="🎬"
          fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-xl"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-2xl">
          ✨
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-1.5 pb-1.5 pt-8">
        <p className="line-clamp-2 text-start wibe-caption font-semibold leading-snug text-background">
          {pick.title}
        </p>
      </div>
      {pick.note && (
        <span className="absolute start-1.5 top-1.5 rounded-full bg-foreground/50 px-1.5 py-0.5 text-xs text-background backdrop-blur-sm">
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
      className="flex h-36 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand/40 bg-brand/5 text-brand transition-colors hover:bg-brand/10"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-brand/15">
        <Plus className="h-4 w-4" />
      </span>
      <span className="wibe-caption font-medium">افزودن</span>
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
          <Button
            key={shelf.categorySlug}
            type="button"
            size="sm"
            variant={selected ? 'default' : 'outline'}
            className="h-11 shrink-0 rounded-full"
            onClick={() => onSelect(shelf.categorySlug)}
          >
            <span>{shelf.categoryIcon}</span>
            <span className="max-w-24 truncate">{shelf.categoryName}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-bold leading-none ${
                selected ? 'bg-background/25' : 'bg-brand/10 text-brand'
              }`}
            >
              {shelf.picks.length.toLocaleString('fa-IR')}
            </span>
          </Button>
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
    <div className="relative min-h-36">
      {shelf.picks.length === 0 ? (
        <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-border bg-muted/50">
          <Button type="button" variant="ghost" size="lg" onClick={() => onEditCategory(shelf.categorySlug)}>
            <Plus />
            افزودن به {shelf.categoryName}
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {shelf.picks.map((pick) => (
                <PickCard key={pick.id} pick={pick} />
              ))}
              {canAddMore && (
                <AddSlotButton onClick={() => onEditCategory(shelf.categorySlug)} />
              )}
          </div>
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
      <Card className="mb-4 overflow-hidden bg-popover">
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Sparkles className="size-4" />
              </span>
              <div className="min-w-0">
                <h2 className="wibe-h3">منتخب‌های من</h2>
                <p className="truncate text-xs text-muted-foreground">
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
                <Button
                  type="button"
                  variant="brand"
                  size="sm"
                  className="h-11"
                  onClick={() => openEditor(activeShelf?.categorySlug)}
                >
                  {hasAnyPicks ? 'مدیریت' : 'شروع کن'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 rounded-full"
                  onClick={() => setHelpOpen(true)}
                  aria-label="راهنمای منتخب‌های من"
                >
                  <HelpCircle />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2.5 p-3 lg:p-3.5">
          {isLoading && !hasAnyPicks && (
            <div className="flex gap-2 overflow-hidden">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-36 w-24 shrink-0 rounded-xl" />
              ))}
            </div>
          )}

          {showEmptyOwner && (
            <div className="rounded-xl border border-dashed border-brand/30 bg-brand/5 px-4 py-4 text-center">
              <p className="text-sm font-semibold text-foreground">
                فیلم، کتاب، کافه — هر کدام تا ۱۰ تا
              </p>
              <Button type="button" variant="brand" size="lg" className="mt-3" onClick={() => openEditor()}>
                <Plus />
                افزودن اولین منتخب
              </Button>
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
      </Card>

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
              <Button type="button" variant="brand" size="lg" className="w-full" onClick={() => setHelpOpen(false)}>
                متوجه شدم
              </Button>
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
