import type { ReactNode } from 'react';
import { LayoutList, Compass, User } from 'lucide-react';

export type ConsumerNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export const CONSUMER_NAV_ITEMS: ConsumerNavItem[] = [
  { href: '/lists', label: 'لیست‌ها', icon: <LayoutList className="h-4 w-4" strokeWidth={2} /> },
  { href: '/explore', label: 'اکسپلور', icon: <Compass className="h-4 w-4" strokeWidth={2} /> },
  { href: '/profile', label: 'پروفایل', icon: <User className="h-4 w-4" strokeWidth={2} /> },
];

/** مسیر رسمی اکسپلور — لندینگ قدیمی /user-lists فقط redirect است */
export const EXPLORE_HREF = '/explore';

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  if (href === EXPLORE_HREF || href === '/user-lists') {
    return pathname === EXPLORE_HREF || pathname.startsWith(`${EXPLORE_HREF}/`);
  }
  // /lists/[slug] و زیرمسیرها؛ نه /lists-something
  return pathname === href || pathname.startsWith(`${href}/`);
}
