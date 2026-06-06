'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/layout/Sidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import QuickCreateFab from '@/components/admin/layout/QuickCreateFab';
import { SidebarProvider } from '@/components/admin/layout/SidebarContext';
import AdminPermissionGuard from '@/components/admin/AdminPermissionGuard';
import AdminReadOnlyBanner from '@/components/admin/AdminReadOnlyBanner';

/**
 * صفحه access-denied بدون سایدبار/هدر سنگین — جلوگیری از خطا و حلقه redirect
 */
function AccessDeniedShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="admin-panel min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 font-vazir"
      dir="rtl"
    >
      <div className="max-w-lg mx-auto px-4 py-12">{children}</div>
    </div>
  );
}

function AdminPanelShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div
        className="admin-panel min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 font-vazir overflow-x-auto"
        dir="rtl"
      >
        <div className="min-w-0 lg:min-w-[1240px] flex min-h-screen">
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

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAccessDenied = pathname === '/admin/access-denied';

  if (isAccessDenied) {
    return <AccessDeniedShell>{children}</AccessDeniedShell>;
  }

  return <AdminPanelShell>{children}</AdminPanelShell>;
}
