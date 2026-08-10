/** Inner profile skeleton — Header/BottomNav already mounted outside Suspense */
export default function ProfilePageContentSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-4 w-28 animate-pulse rounded bg-wibe-surface" />
      <div className="overflow-hidden rounded-xl border border-wibe">
        <div className="h-14 animate-pulse bg-wibe-surface" />
        <div className="flex items-start gap-3 px-2.5 pb-2.5 -mt-8">
          <div className="flex-1 space-y-1.5 pt-1.5">
            <div className="h-4 w-14 animate-pulse rounded-full bg-wibe-surface" />
            <div className="h-5 w-28 animate-pulse rounded bg-wibe-surface" />
            <div className="h-3 w-16 animate-pulse rounded bg-wibe-surface" />
          </div>
          <div className="h-[82px] w-[82px] shrink-0 animate-pulse rounded-full border-[3px] border-white bg-wibe-surface" />
        </div>
        <div className="mx-2.5 mb-3 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-wibe-surface" />
          ))}
        </div>
      </div>
      <div className="h-12 animate-pulse rounded-xl bg-wibe-surface" />
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-36 w-[72%] shrink-0 animate-pulse rounded-xl bg-wibe-surface"
          />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-wibe-surface" />
        ))}
      </div>
    </div>
  );
}
