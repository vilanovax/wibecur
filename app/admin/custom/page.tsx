import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';

export default async function AdminCustomPage() {
  await requireAdmin();
  redirect('/admin/custom/featured');
}
