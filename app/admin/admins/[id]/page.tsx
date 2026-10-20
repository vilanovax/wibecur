import { requirePermission } from '@/lib/auth/require-permission';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import AdminDossierClient from '@/components/admin/admins/AdminDossierClient';

export const dynamic = 'force-dynamic';

export default async function AdminDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userOrRes = await requirePermission('manage_roles');
  if (userOrRes instanceof NextResponse) {
    redirect('/admin/access-denied?perm=manage_roles');
  }
  const { id } = await params;
  return <AdminDossierClient adminId={id} />;
}
