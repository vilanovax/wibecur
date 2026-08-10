export function CategoryTrendingSectionSkeleton() {
  return (
    <section className="py-5 lg:py-6" aria-hidden>
      <div className="mb-3 h-6 w-48 animate-pulse rounded bg-wibe-surface lg:mb-4" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-wibe-surface" />
        ))}
      </div>
    </section>
  );
}

export function CategorySectionSkeleton() {
  return (
    <section className="py-5 lg:py-6" aria-hidden>
      <div className="mb-3 h-6 w-40 animate-pulse rounded bg-wibe-surface" />
      <div className="h-28 animate-pulse rounded-xl bg-wibe-surface" />
    </section>
  );
}
