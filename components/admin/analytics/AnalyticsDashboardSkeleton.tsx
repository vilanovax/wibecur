export default function AnalyticsDashboardSkeleton() {
  return (
    <div className="max-w-5xl space-y-4" dir="rtl" aria-hidden>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-28 animate-pulse rounded-lg bg-(--color-border-muted)" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-(--color-border-muted)" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-11 w-16 animate-pulse rounded-xl bg-(--color-border-muted)"
            />
          ))}
        </div>
      </div>
      <div className="h-20 animate-pulse rounded-xl bg-(--color-border-muted)" />
      <div className="h-44 animate-pulse rounded-xl bg-(--color-border-muted)" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-5 w-28 animate-pulse rounded bg-(--color-border-muted)" />
          <div className="h-20 animate-pulse rounded-xl bg-(--color-border-muted)" />
        </div>
      ))}
    </div>
  );
}
