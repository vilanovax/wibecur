/**
 * Shared types for profile components (owner + public views).
 * No backend contract changes — aligned with existing API responses.
 */

export interface CreatorStats {
  viralListsCount: number;
  popularListsCount: number;
  totalLikesReceived: number;
  profileViews: number;
  totalItemsCurated: number;
}

export interface ProfileUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  username?: string | null;
  bio?: string | null;
  avatarType?: 'DEFAULT' | 'UPLOADED';
  avatarId?: string | null;
  avatarStatus?: 'APPROVED' | 'PENDING' | 'REJECTED' | null;
  showBadge?: boolean;
  stats?: { listsCreated: number; bookmarks: number; likes: number; itemLikes: number };
  creatorStats?: CreatorStats;
  expertise?: { name: string; slug: string; icon: string; count: number }[];
  curatorLevel?: string;
  curatorScore?: number;
  curatorNextLevelLabel?: string | null;
  curatorPointsToNext?: number | null;
}

export interface TopListItem {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  likeCount?: number | null;
  saveCount?: number | null;
  viewCount?: number | null;
  itemCount?: number | null;
  categories?: { name: string; slug: string; icon: string } | null;
}
