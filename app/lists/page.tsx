import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';

export default function ListsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="لیست‌ها" />
      <main className="px-4 py-6">
        <p className="text-gray-600">صفحه لیست‌ها - در حال توسعه</p>
      </main>
      <BottomNav />
    </div>
  );
}

