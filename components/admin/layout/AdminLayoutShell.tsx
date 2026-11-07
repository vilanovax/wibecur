'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/layout/Sidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import QuickCreateFab from '@/components/admin/layout/QuickCreateFab';
import { SidebarProvider } from '@/components/admin/layout/SidebarContext';
import AdminPermissionGuard from '@/components/admin/AdminPermissionGuard';
import AdminReadOnlyBanner from '@/components/admin/AdminReadOnlyBanner';
import AdminSessionGate from '@/components/admin/AdminSessionGate';

/**
 * صفحه access-denied بدون سایدبار/هدر سنگین — جلوگیری از خطا و حلقه redirect
 */
function AccessDeniedShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionGate>
      <div
        className="admin-panel min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 font-vazir"
        dir="rtl"
      >
        <div className="mx-auto max-w-lg px-4 py-12">{children}</div>
      </div>
    </AdminSessionGate>
  );
}

function AdminPanelShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionGate>
      <SidebarProvider>
        <div
          className="admin-panel min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 font-vazir"
          dir="rtl"
        >
          {/* بدون min-width ثابت — محتوا واکنش‌گرا reflow می‌شود و کل صفحه اسکرول افقی نمی‌خورد.
              اجزای عریض (مثل جدول رادار) overflow داخلی خودشان را دارند. */}
          <div className="flex min-h-screen min-w-0">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <AdminHeader />
              <main className="min-w-0 flex-1 bg-transparent transition-all duration-300">
                <div className="mx-auto flex max-w-350 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
                  <AdminReadOnlyBanner />
                  <AdminPermissionGuard>{children}</AdminPermissionGuard>
                </div>
              </main>
            </div>
          </div>
          <QuickCreateFab />
        </div>
      </SidebarProvider>
    </AdminSessionGate>
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
