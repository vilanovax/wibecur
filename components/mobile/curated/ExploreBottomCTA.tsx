'use client';

import Link from 'next/link';

interface ExploreBottomCTAProps {
  onOpenCreate?: () => void;
}

export default function ExploreBottomCTA({ onOpenCreate }: ExploreBottomCTAProps) {
  return (
    <section className="mx-4 mb-8 rounded-lg overflow-hidden bg-primary p-5 shadow-sm" aria-label="ساخت لیست">
      <p className="wibe-h3 text-white mb-1">لیست خودتو بساز</p>
      <p className="wibe-small text-white/85 mb-4">چند ثانیه طول می‌کشه</p>
      {onOpenCreate ? (
        <button
          type="button"
          onClick={onOpenCreate}
          className="w-full py-3 px-4 rounded-md bg-wibe-card text-primary wibe-small font-semibold active:scale-[0.99] transition-transform"
        >
          ساخت لیست
        </button>
      ) : (
        <Link
          href="/user-lists?openCreate=1"
          className="block w-full py-3 px-4 rounded-md bg-wibe-card text-primary wibe-small font-semibold text-center active:scale-[0.99] transition-transform"
        >
          ساخت لیست
        </Link>
      )}
    </section>
  );
}
