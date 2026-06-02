import Link from 'next/link';
import { DESKTOP_CONTENT_PADDING_CLASS } from '@/lib/layout-tokens';

const FOOTER_LINKS = [
  { href: '/', label: 'خانه' },
  { href: '/lists', label: 'لیست‌ها' },
  { href: '/user-lists', label: 'اکسپلور' },
  { href: '/profile', label: 'پروفایل' },
] as const;

/**
 * فوتر دسکتاپ — داخل همان فریم ۱۰۲۴px شِل سایت
 */
export default function DesktopSiteFooter() {
  return (
    <footer
      className={`mt-auto hidden border-t border-wibe/80 bg-wibe-surface/50 py-6 lg:block ${DESKTOP_CONTENT_PADDING_CLASS}`}
      role="contentinfo"
    >
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2" aria-label="پاورقی">
        {FOOTER_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="wibe-small font-medium text-wibe-secondary transition-colors hover:text-primary"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <p className="mt-4 text-center wibe-caption text-wibe-secondary">
        © {new Date().getFullYear()} وایب — لیست‌های کیوریتد لایف‌استایل
      </p>
    </footer>
  );
}
