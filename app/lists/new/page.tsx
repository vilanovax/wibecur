import { redirect } from 'next/navigation';

/** مسیر آشنا برای «ساخت لیست» — به فرم ساخت در اکسپلور می‌فرستد. */
export default function ListsNewRedirectPage() {
  redirect('/explore?openCreate=1');
}
