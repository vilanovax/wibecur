import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';

export default function SponsoredPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="bg-wibe-surface">
      <Header title="ویژه" showBack />
      <div className="p-4 text-center text-wibe-secondary">
        <p>صفحه اسپانسر — به زودی</p>
      </div>
      <BottomNav />
    </div>
  );
}
