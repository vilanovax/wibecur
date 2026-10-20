export default function AdminDossierLoading() {
  return (
    <div className="space-y-6" dir="rtl" aria-busy="true" aria-label="در حال بارگذاری پرونده">
      <div className="h-8 w-40 rounded-lg bg-gray-100 dark:bg-gray-700" />
      <div className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-700" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-700" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-96 rounded-2xl bg-gray-100 dark:bg-gray-700" />
        <div className="h-96 rounded-2xl bg-gray-100 dark:bg-gray-700" />
      </div>
    </div>
  );
}
