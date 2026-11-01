'use client';

import HomeListSaveControl from '@/components/mobile/home/HomeListSaveControl';

type HomeHeroSaveButtonProps = {
  listId: string;
  listSlug: string;
  categorySlug?: string | null;
  saveCount?: number;
};

/** جزیرهٔ کلاینت ذخیره روی هیرو SSR/CSR */
export default function HomeHeroSaveButton({
  listId,
  listSlug,
  categorySlug,
  saveCount = 0,
}: HomeHeroSaveButtonProps) {
  return (
    <div className="absolute inset-e-3 top-3 z-20 sm:inset-e-4 sm:top-4 lg:inset-e-5 lg:top-5">
      <HomeListSaveControl
        listId={listId}
        listSlug={listSlug}
        categorySlug={categorySlug}
        saveCount={saveCount}
        surface="hero"
        analyticsSource="home_hero"
      />
    </div>
  );
}
