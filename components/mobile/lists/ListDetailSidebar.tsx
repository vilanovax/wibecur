'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Lightbulb, Plus, Settings, Share2 } from 'lucide-react';
import { SponsoredPlacementStack } from '@/components/shared/SponsoredTextBanner';
import type { SponsoredPlacementPublic } from '@/lib/sponsored-placements';
import { DESKTOP_STICKY_BELOW_PAGE_HEADER_CLASS } from '@/lib/layout-tokens';
import { shouldShowViralProgress } from '@/lib/list-viral-display';

interface ListDetailSidebarProps {
  listId: string;
  saveCount: number;
  isOwner: boolean;
  viralProgress: number;
  sidebarAds?: SponsoredPlacementPublic[];
  sidebarAdListId?: string;
  sidebarAdCategoryId?: string;
  tags?: string[];
  onShare: () => void;
  onManage: () => void;
  onSuggestItem: () => void;
  statsBar: ReactNode;
}

export default function ListDetailSidebar({
  listId,
  saveCount,
  isOwner,
  viralProgress,
  sidebarAds = [],
  sidebarAdListId,
  sidebarAdCategoryId,
  tags = [],
  onShare,
  onManage,
  onSuggestItem,
  statsBar,
}: ListDetailSidebarProps) {
  return (
    <aside className="hidden lg:block">
      <div className={`${DESKTOP_STICKY_BELOW_PAGE_HEADER_CLASS} space-y-4`}>
        {statsBar}

        <div className="space-y-2 rounded-xl border border-wibe bg-wibe-card p-4 shadow-sm">
          <button
            type="button"
            onClick={onShare}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 wibe-small font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            <Share2 className="h-4 w-4" />
            اشتراک‌گذاری
          </button>
          {isOwner ? (
            <button
              type="button"
              onClick={onManage}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-wibe bg-wibe-surface py-2.5 wibe-small font-medium text-wibe-secondary transition-colors hover:border-primary/25 hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              مدیریت لیست
            </button>
          ) : (
            <button
              type="button"
              onClick={onSuggestItem}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-wibe bg-wibe-surface py-2.5 wibe-small font-medium text-foreground transition-colors hover:border-primary/25"
            >
              <Lightbulb className="h-4 w-4 text-primary" />
              پیشنهاد آیتم
            </button>
          )}
          {isOwner && shouldShowViralProgress(saveCount) ? (
            <div>
              <div className="mb-1 flex items-center justify-between wibe-caption text-wibe-secondary">
                <span>پیشرفت وایرال</span>
                <span className="font-semibold tabular-nums">
                  {Math.round(viralProgress).toLocaleString('fa-IR')}٪
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-wibe-surface">
                <div
                  className="h-full rounded-full bg-warning transition-colors"
                  style={{ width: `${viralProgress}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {sidebarAds.length > 0 ? (
          <SponsoredPlacementStack
            placements={sidebarAds}
            listId={sidebarAdListId}
            categoryId={sidebarAdCategoryId}
            variant="sidebar"
          />
        ) : null}

        {tags.length > 0 && (
          <div className="rounded-xl border border-wibe bg-wibe-card p-4 shadow-sm">
            <p className="mb-2 wibe-caption font-medium text-wibe-secondary">برچسب‌ها</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-md bg-wibe-surface px-2.5 py-1 wibe-caption text-wibe-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {isOwner ? (
          <Link
            href={`/user-lists/${listId}/add-item`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/35 bg-primary/5 py-3 wibe-small font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Plus className="h-4 w-4" />
            افزودن آیتم
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
