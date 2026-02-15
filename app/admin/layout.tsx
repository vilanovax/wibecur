import Sidebar from '@/components/admin/layout/Sidebar';
import TopBar from '@/components/admin/layout/TopBar';

export const dynamic = 'force-dynamic';

/**
 * پنل ادمین — فقط برای دسکتاپ بهینه شده.
 * حداقل عرض 1280px برای جلوگیری از نمایش موبایلی.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-panel admin-desktop-only min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-vazir" dir="rtl">
      <div className="min-w-[1280px]">
        <TopBar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-w-0 p-6 transition-all duration-300 bg-transparent">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
