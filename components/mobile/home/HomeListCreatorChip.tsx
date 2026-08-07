'use client';

import Link from 'next/link';
import CommentAvatar from '@/components/shared/CommentAvatar';
import { trackCreatorProfileView, type CreatorProfileSource } from '@/lib/analytics';
import type { HomeListCreator } from '@/types/home-data';

type Props = {
  creator?: HomeListCreator | null;
  className?: string;
  size?: number;
  linkable?: boolean;
  analyticsSource?: CreatorProfileSource;
};

export default function HomeListCreatorChip({
  creator,
  className = '',
  size = 18,
  linkable = true,
  analyticsSource = 'list_card',
}: Props) {
  if (!creator) return null;

  const label = creator.name?.trim() || creator.username || 'سازنده';
  const profileHref = creator.username ? `/u/${creator.username}` : null;

  const inner = (
    <>
      <CommentAvatar
        src={creator.image}
        name={creator.name}
        size={size}
        className="ring-1 ring-white/30"
      />
      <span className="truncate max-w-[5.5rem] lg:max-w-[7rem]">{label}</span>
    </>
  );

  const toneClass = className || 'text-white/85';

  if (linkable && profileHref) {
    return (
      <Link
        href={profileHref}
        onClick={(e) => {
          e.stopPropagation();
          if (creator.username) trackCreatorProfileView(creator.username, analyticsSource);
        }}
        className={`inline-flex min-w-0 items-center gap-1.5 wibe-caption hover:text-white ${toneClass}`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 wibe-caption ${toneClass}`}>
      {inner}
    </span>
  );
}
