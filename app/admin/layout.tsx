import Sidebar from '@/components/admin/layout/Sidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import QuickCreateFab from '@/components/admin/layout/QuickCreateFab';
import { SidebarProvider } from '@/components/admin/layout/SidebarContext';
import AdminPermissionGuard from '@/components/admin/AdminPermissionGuard';
import AdminReadOnlyBanner from '@/components/admin/AdminReadOnlyBanner';

export const dynamic = 'force-dynamic';

/**
 * Layout ادمین 2.0: Sidebar + MainArea (Header + Content)
 * - Sidebar: w-72 / w-20 (collapsible), localStorage, mobile overlay drawer
 * - Header: h-16، toggle + breadcrumb | search | profile+notifications+role
 * - Content: max-w-[1400px], gap-6
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="admin-panel min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 font-vazir overflow-x-auto" dir="rtl">
        <div className="min-w-0 lg:min-w-[1280px] flex min-h-screen">
          <Sidebar />
          <div className="flex-1 min-w-0 flex flex-col">
            <AdminHeader />
            <main className="flex-1 min-w-0 transition-all duration-300 bg-transparent">
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
                <AdminReadOnlyBanner />
                <AdminPermissionGuard>{children}</AdminPermissionGuard>
              </div>
            </main>
          </div>
        </div>
        <QuickCreateFab />
      </div>
    </SidebarProvider>
  );
}
