'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Lightbulb, Plus, Settings, Share2 } from 'lucide-react';
import { SponsoredPlacementStack } from '@/components/shared/SponsoredTextBanner';
import type { SponsoredPlacementPublic } from '@/lib/sponsored-placements';
import { DESKTOP_STICKY_BELOW_PAGE_HEADER_CLASS } from '@/lib/layout-tokens';
import { shouldShowViralProgress } from '@/lib/list-viral-display';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
  onEdit?: () => void;
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
  onEdit,
  onSuggestItem,
  statsBar,
}: ListDetailSidebarProps) {
  return (
    <aside className="hidden lg:block">
      <div className={`${DESKTOP_STICKY_BELOW_PAGE_HEADER_CLASS} space-y-4`}>
        {statsBar}

        <Card className="space-y-2 bg-popover p-4">
          {onEdit ? (
            <Button type="button" variant="outline" size="lg" className="w-full" onClick={onEdit}>
              <Settings className="h-4 w-4" />
              ویرایش لیست
            </Button>
          ) : null}
          <Button type="button" variant="brand" size="lg" className="w-full" onClick={onShare}>
            <Share2 />
            اشتراک‌گذاری
          </Button>
          {isOwner ? (
            <Button type="button" variant="outline" size="lg" className="w-full" onClick={onManage}>
              <Settings />
              مدیریت لیست
            </Button>
          ) : (
            <Button type="button" variant="outline" size="lg" className="w-full" onClick={onSuggestItem}>
              <Lightbulb />
              پیشنهاد آیتم
            </Button>
          )}
          {isOwner && shouldShowViralProgress(saveCount) ? (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>پیشرفت وایرال</span>
                <span className="font-semibold tabular-nums">
                  {Math.round(viralProgress).toLocaleString('fa-IR')}٪
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-warning transition-colors"
                  style={{ width: `${viralProgress}%` }}
                />
              </div>
            </div>
          ) : null}
        </Card>

        {sidebarAds.length > 0 ? (
          <SponsoredPlacementStack
            placements={sidebarAds}
            listId={sidebarAdListId}
            categoryId={sidebarAdCategoryId}
            variant="sidebar"
          />
        ) : null}

        {tags.length > 0 && (
          <>
            <Separator />
            <Card className="bg-popover p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">برچسب‌ها</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.slice(0, 6).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="min-h-11 rounded-full bg-muted px-3 text-sm"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          </>
        )}

        {isOwner ? (
          <Link
            href={`/user-lists/${listId}/add-item`}
            className="inline-flex h-12 w-full items-center justify-center rounded-control border border-dashed border-brand/40 bg-brand/5"
          >
            <span className="inline-flex items-center gap-2 text-base font-semibold text-brand">
              <Plus className="h-4 w-4" />
              افزودن آیتم
            </span>
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
