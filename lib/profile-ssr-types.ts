export type ProfileBookmarkSSR = {
  id: string;
  createdAt: string;
  list: Record<string, unknown>;
};

export type ProfileActivitySSR = {
  id: string;
  type: string;
  title: string;
  description: string;
  image: string | null;
  slug?: string;
  itemId?: string;
  category: unknown;
  createdAt: string;
  likeCount: number;
  viewCount: number;
  saveCount: number;
};
