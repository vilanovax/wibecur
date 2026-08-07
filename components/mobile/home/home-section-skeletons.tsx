export function HomeFeedSectionSkeleton({ titleWidth = 'w-36' }: { titleWidth?: string }) {
  return (
    <section className="mb-6" aria-hidden>
      <div className="mb-3 px-4 lg:px-0">
        <div className={`h-6 ${titleWidth} animate-pulse rounded bg-wibe-surface`} />
      </div>
      <div className="mx-4 h-28 animate-pulse rounded-xl bg-wibe-surface lg:mx-0 lg:h-36" />
    </section>
  );
}
