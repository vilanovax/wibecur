'use client';

import type { FeedGridCell } from '@/lib/home-feed-grid';
import { isSeeAllCell } from '@/lib/home-feed-grid';
import type { HomeSectionId } from '@/lib/analytics';
import type { HomeGridListCardList } from './HomeGridListCard';
import HomeGridListCard from './HomeGridListCard';
import HomeFeedSeeAllCard from './HomeFeedSeeAllCard';

type Props = {
  cells: FeedGridCell<HomeGridListCardList>[];
  badge?: string | null;
  badgeClassName?: string;
  getBadge?: (list: HomeGridListCardList) => string | null;
  getBadgeClassName?: (list: HomeGridListCardList) => string;
  homeSection?: HomeSectionId;
};

export default function HomeFeedGrid({
  cells,
  badge,
  badgeClassName,
  getBadge,
  getBadgeClassName,
  homeSection,
}: Props) {
  return (
    <>
      {cells.map((cell, index) => {
        if (isSeeAllCell(cell)) {
          return (
            <HomeFeedSeeAllCard
              key={`see-all-${cell.href}-${index}`}
              href={cell.href}
              label={cell.label}
              description={cell.description}
            />
          );
        }
        const listBadge = getBadge?.(cell.data) ?? badge ?? null;
        const listBadgeClass = getBadgeClassName?.(cell.data) ?? badgeClassName;
        return (
          <HomeGridListCard
            key={cell.data.id}
            list={cell.data}
            badge={listBadge}
            badgeClassName={listBadgeClass}
            homeSection={homeSection}
          />
        );
      })}
    </>
  );
}
