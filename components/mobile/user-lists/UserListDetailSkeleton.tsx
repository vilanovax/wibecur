export default function UserListDetailSkeleton() {
  return (
    <main className="min-h-[100dvh] space-y-6 bg-wibe-surface">
      <div className="h-[168px] animate-pulse bg-wibe-card sm:h-[190px]" />
      <div className="space-y-3 px-4">
        <div className="h-8 w-36 animate-pulse rounded-md bg-wibe-card" />
        <div className="h-4 w-full animate-pulse rounded bg-wibe-card" />
        <div className="h-4 w-[80%] animate-pulse rounded bg-wibe-card" />
        <div className="h-11 w-full animate-pulse rounded-md bg-wibe-card" />
      </div>
      <div className="space-y-3 px-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded bg-wibe-card" />
          <div className="h-9 w-28 animate-pulse rounded-md bg-wibe-card" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-3 rounded-lg border border-wibe bg-wibe-card p-3"
          >
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-wibe-surface" />
            <div className="h-14 w-14 shrink-0 animate-pulse rounded-md bg-wibe-surface" />
            <div className="min-w-0 flex-1 space-y-2 py-1">
              <div className="h-4 w-[66%] animate-pulse rounded bg-wibe-surface" />
              <div className="h-3 w-full animate-pulse rounded bg-wibe-surface" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
