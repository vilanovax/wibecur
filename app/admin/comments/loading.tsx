export default function CommentsLoading() {
  return (
    <div className="space-y-4" style={{ direction: 'rtl' }}>
      <div className="h-10 w-48 bg-slate-200 rounded-xl animate-pulse" />
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex gap-2 mb-3">
          <div className="h-10 flex-1 max-w-md bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-10 w-24 bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-9 w-24 bg-slate-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="h-4 flex-1 min-w-[80px] bg-slate-200 rounded animate-pulse"
            />
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="border-b border-slate-100 px-4 py-3 flex gap-4"
          >
            <div className="h-4 w-4 bg-slate-100 rounded animate-pulse" />
            <div className="h-10 w-32 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-4 flex-1 max-w-[200px] bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse" />
            <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
