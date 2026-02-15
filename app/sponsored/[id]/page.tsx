import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';

export default function SponsoredPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="ویژه" showBack />
      <div className="p-4 text-center text-gray-500">
        <p>صفحه اسپانسر — به زودی</p>
      </div>
      <BottomNav />
    </div>
  );
}
