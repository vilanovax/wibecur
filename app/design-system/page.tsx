import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import DesignSystemShowcase from './DesignSystemShowcase';

export const metadata = {
  title: 'نمایش طراحی',
  description: 'نمونهٔ دکمه‌ها، کارت‌ها و کنترل‌های وایب‌فارسی',
};

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header title="نمایش طراحی" showBack showDesktopSearch={false} />
      <DesignSystemShowcase />
      <BottomNav />
    </div>
  );
}
