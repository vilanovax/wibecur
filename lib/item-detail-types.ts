/** Client-safe types for item detail (no server-only imports). */

export type ItemDetailClientSeed = {
  id: string;
  title: string;
  catalogItemId: string | null;
  voteCount: number | null;
  itemCategorySlug: string | null;
  isLightweight: boolean;
  lists: {
    id: string;
    title: string;
    slug: string;
    saveCount: number;
    categories: {
      id: string;
      name: string;
      slug: string;
      icon: string;
      color: string;
    } | null;
  };
};
