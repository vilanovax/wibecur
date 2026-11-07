import { redirect } from 'next/navigation';

/** میانبر قدرت‌کاربر برای ساخت لیست. */
export default function CreateRedirectPage() {
  redirect('/explore?openCreate=1');
}
