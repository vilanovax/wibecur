'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import SiteLogo from '@/components/shared/SiteLogo';
import { DESKTOP_CONTENT_PADDING_CLASS } from '@/lib/layout-tokens';

const WIBE_SITE_URL = 'https://wibe.ir';

const FOOTER_LINKS = [
  { href: '/', label: 'خانه' },
  { href: '/lists', label: 'لیست‌ها' },
  { href: '/explore', label: 'اکسپلور' },
  { href: '/categories', label: 'دسته‌ها' },
  { href: '/profile', label: 'پروفایل' },
] as const;

interface SiteFooterProps {
  variant?: 'desktop' | 'mobile';
}

/** لینک واحد برند: کپی‌رایت + wibe.ir — بدون toLocaleString تا هیدریشن/CLS نشکند */
function WibeBrandLink({ className = '' }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <a
      href={WIBE_SITE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 wibe-caption text-wibe-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${className}`}
      aria-label={`© ${year} وایب — wibe.ir`}
    >
      <span>
        © <span suppressHydrationWarning>{year}</span> وایب
        <span className="mx-1.5 text-wibe-secondary/35" aria-hidden>
          ·
        </span>
        <span className="font-semibold text-foreground/75 group-hover:text-primary">wibe.ir</span>
      </span>
      <ExternalLink
        className="h-3.5 w-3.5 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </a>
  );
}

export default function SiteFooter({ variant = 'desktop' }: SiteFooterProps) {
  if (variant === 'mobile') {
    return (
      <footer
        className="border-t border-wibe/70 bg-wibe-card px-4 py-3 lg:hidden"
        role="contentinfo"
      >
        <div className="mx-auto flex max-w-sm flex-col items-center gap-1.5 text-center">
          <WibeBrandLink />
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`mt-auto hidden min-h-[11.5rem] border-t border-wibe bg-wibe-card lg:block ${DESKTOP_CONTENT_PADDING_CLASS}`}
      role="contentinfo"
    >
      <div className="py-8 xl:py-10">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-right">
            <SiteLogo variant="nav" href="/" />
            <p className="max-w-xs wibe-small text-wibe-secondary">
              کشف و اشتراک‌گذاری لیست‌های کیوریتد
            </p>
          </div>

          <nav
            className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1"
            aria-label="پاورقی"
          >
            {FOOTER_LINKS.map((item, index) => (
              <span key={item.href} className="inline-flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-wibe-secondary/35" aria-hidden>
                    ·
                  </span>
                )}
                <Link
                  href={item.href}
                  className="wibe-small font-medium text-foreground/75 transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>

        <div className="mt-6 flex justify-center border-t border-wibe/70 pt-5 lg:justify-start">
          <WibeBrandLink />
        </div>
      </div>
    </footer>
  );
}
