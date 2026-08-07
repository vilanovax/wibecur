'use client';

export default function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl" style={{ direction: 'rtl' }}>
      {/* System Status Bar skeleton */}
      <div className="rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 animate-pulse">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="h-5 w-40 bg-slate-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-4 w-full max-w-md bg-slate-100 dark:bg-gray-700/50 rounded" />
          </div>
          <div className="h-10 w-28 bg-slate-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>

      {/* Growth Block skeleton */}
      <div className="rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 animate-pulse border-l-4 border-l-slate-300">
        <div className="h-5 w-24 bg-slate-200 dark:bg-gray-700 rounded mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div>
            <div className="h-4 w-32 bg-slate-100 dark:bg-gray-700/50 rounded mb-2" />
            <div className="h-9 w-20 bg-slate-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-28 bg-slate-100 dark:bg-gray-700/50 rounded mt-2" />
          </div>
          <div className="lg:col-span-3 grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
                <div className="h-3 w-24 bg-slate-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-6 w-16 bg-slate-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="h-4 w-full max-w-xl bg-slate-100 dark:bg-gray-700/50 rounded mt-3" />
      </div>

      {/* Content Block skeleton */}
      <div className="rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 animate-pulse border-l-4 border-l-slate-300">
        <div className="h-5 w-28 bg-slate-200 dark:bg-gray-700 rounded mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div>
            <div className="h-4 w-28 bg-slate-100 dark:bg-gray-700/50 rounded mb-2" />
            <div className="h-9 w-16 bg-slate-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="lg:col-span-3 grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
                <div className="h-3 w-20 bg-slate-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-6 w-14 bg-slate-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="h-4 w-full max-w-lg bg-slate-100 dark:bg-gray-700/50 rounded mt-3" />
      </div>

      {/* Algorithm Health skeleton */}
      <div className="rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 animate-pulse border-l-4 border-l-slate-300">
        <div className="h-5 w-36 bg-slate-200 dark:bg-gray-700 rounded mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div>
            <div className="h-4 w-40 bg-slate-100 dark:bg-gray-700/50 rounded mb-2" />
            <div className="h-9 w-14 bg-slate-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="lg:col-span-3 grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
                <div className="h-3 w-24 bg-slate-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-6 w-12 bg-slate-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="h-4 w-full max-w-xl bg-slate-100 dark:bg-gray-700/50 rounded mt-3" />
      </div>

      {/* Chart skeleton */}
      <div className="rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-gray-700">
          <div className="h-5 w-28 bg-slate-200 dark:bg-gray-700 rounded mb-1" />
          <div className="h-3 w-48 bg-slate-100 dark:bg-gray-700/50 rounded" />
        </div>
        <div className="p-6">
          <div className="h-32 w-full rounded-lg bg-slate-100 dark:bg-gray-700/50 animate-pulse" />
          <div className="flex gap-6 mt-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-24 bg-slate-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
