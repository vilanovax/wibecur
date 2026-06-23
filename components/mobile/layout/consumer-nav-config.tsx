import type { ReactNode } from 'react';
import { LayoutList, Compass, User } from 'lucide-react';

export type ConsumerNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export const CONSUMER_NAV_ITEMS: ConsumerNavItem[] = [
  { href: '/lists', label: 'لیست‌ها', icon: <LayoutList className="h-4 w-4" strokeWidth={2} /> },
  { href: '/user-lists', label: 'اکسپلور', icon: <Compass className="h-4 w-4" strokeWidth={2} /> },
  { href: '/profile', label: 'پروفایل', icon: <User className="h-4 w-4" strokeWidth={2} /> },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
