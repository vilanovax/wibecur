'use client';

interface ExploreBottomCTAProps {
  onOpenCreate?: () => void;
}

/** CTA فشرده — بدون بنر بزرگ (دکمه ساخت در BottomNav هست) */
export default function ExploreBottomCTA({ onOpenCreate }: ExploreBottomCTAProps) {
  if (!onOpenCreate) return null;

  return (
    <section className="mx-2.5 mb-6 mt-2" aria-label="ساخت لیست">
      <button
        type="button"
        onClick={onOpenCreate}
        className="w-full rounded-xl border border-dashed border-primary/35 bg-primary/[0.04] py-3 text-center wibe-small font-semibold text-primary transition-colors active:scale-[0.99] hover:bg-primary/[0.07]"
      >
        + لیست خودت را بساز
      </button>
    </section>
  );
}
