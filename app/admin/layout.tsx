import AdminLayoutShell from '@/components/admin/layout/AdminLayoutShell';

export const dynamic = 'force-dynamic';

/**
 * Layout ادمین 2.0: Sidebar + MainArea (Header + Content)
 * - Sidebar: ~212px / w-14 collapsed, localStorage, mobile overlay drawer
 * - Header: h-16، toggle + breadcrumb | search | profile+notifications+role
 * - Content: max-w-[1400px], gap-6
 * - access-denied: layout ساده بدون سایدبار
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
