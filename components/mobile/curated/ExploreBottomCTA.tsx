'use client';

interface ExploreBottomCTAProps {
  onOpenCreate?: () => void;
}

/** CTA فشرده — بدون بنر بزرگ */
export default function ExploreBottomCTA({ onOpenCreate }: ExploreBottomCTAProps) {
  if (!onOpenCreate) return null;

  return (
    <section className="mx-2.5 mb-6 mt-2 lg:mx-0 lg:mb-4 lg:mt-4 lg:flex lg:justify-center" aria-label="ساخت لیست">
      <button
        type="button"
        onClick={onOpenCreate}
        className="min-h-12 w-full rounded-xl border border-dashed border-brand/35 bg-brand/5 px-4 py-3 text-center transition-colors active:scale-[0.99] hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 lg:max-w-md"
      >
        <span className="block wibe-small font-semibold text-brand">لیست خودت رو بساز</span>
        <span className="mt-0.5 block wibe-caption text-muted-foreground">
          برای امشب، سفر، بچه، قرار، فیلم یا کافه
        </span>
      </button>
    </section>
  );
}
