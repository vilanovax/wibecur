import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import DesignSystemShowcase from './DesignSystemShowcase';

export const metadata = {
  title: 'Design System — Wibe',
  description: 'مرجع داخلی توکن‌ها و کامپوننت‌های consumer UI',
};

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-wibe-surface">
      <Header title="Design System" showBack showDesktopSearch={false} />
      <main className="wibe-desktop-shell pb-24 lg:pb-8">
        <DesignSystemShowcase />
      </main>
      <BottomNav />
    </div>
  );
}
