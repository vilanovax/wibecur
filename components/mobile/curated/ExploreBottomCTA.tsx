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
        className="w-full rounded-xl border border-dashed border-primary/35 bg-primary/[0.04] px-4 py-3.5 text-center transition-colors active:scale-[0.99] hover:bg-primary/[0.07] lg:max-w-md"
      >
        <span className="block wibe-small font-semibold text-primary">لیست خودت رو بساز</span>
        <span className="mt-0.5 block wibe-caption text-wibe-secondary">
          برای امشب، سفر، بچه، قرار، فیلم یا کافه
        </span>
      </button>
    </section>
  );
}
