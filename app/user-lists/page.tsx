import { redirect } from 'next/navigation';

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * لندینگ قدیمی اکسپلور — به /explore منتقل شد.
 * جزئیات لیست شخصی: /user-lists/[id]
 */
export default async function UserListsLandingRedirect({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') qs.set(key, value);
    else if (Array.isArray(value)) {
      for (const v of value) qs.append(key, v);
    }
  }
  const query = qs.toString();
  redirect(query ? `/explore?${query}` : '/explore');
}
