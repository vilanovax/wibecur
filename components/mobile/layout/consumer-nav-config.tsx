import type { ReactNode } from 'react';
import { LayoutList, Compass, User, Plus } from 'lucide-react';

export type ConsumerNavItem = {
  href?: string;
  label: string;
  icon: ReactNode;
  isButton?: boolean;
  /** هدر دسکتاپ: فقط آیکون، بدون متن */
  iconOnly?: boolean;
};

export const CONSUMER_NAV_ITEMS: ConsumerNavItem[] = [
  { href: '/lists', label: 'لیست‌ها', icon: <LayoutList className="h-4 w-4" strokeWidth={2} /> },
  {
    label: 'ساخت',
    icon: <Plus className="h-5 w-5" strokeWidth={2.5} />,
    isButton: true,
    iconOnly: true,
  },
  { href: '/user-lists', label: 'اکسپلور', icon: <Compass className="h-4 w-4" strokeWidth={2} /> },
  { href: '/profile', label: 'پروفایل', icon: <User className="h-4 w-4" strokeWidth={2} /> },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
