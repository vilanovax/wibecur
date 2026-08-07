import { requirePermission } from '@/lib/auth/require-permission';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import AdminsPageClient from '@/components/admin/admins/AdminsPageClient';

export const dynamic = 'force-dynamic';

export default async function AdminAdminsPage() {
  const userOrRes = await requirePermission('manage_roles');
  if (userOrRes instanceof NextResponse) {
    redirect('/admin/access-denied?perm=manage_roles');
  }

  return <AdminsPageClient />;
}
