import { redirect } from 'next/navigation';

/** مسیر قدیمی — اکسپلور روی /user-lists است */
export default function ExploreRedirectPage() {
  redirect('/user-lists');
}
