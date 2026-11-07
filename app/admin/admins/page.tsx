import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** مسیر قدیمی — به تب ادمین‌ها در صفحهٔ کاربران منتقل شد */
export default function AdminAdminsPage() {
  redirect('/admin/users?tab=admins');
}
