'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import SiteLogo from '@/components/shared/SiteLogo';
import { ADMIN_PANEL_VERSION } from '@/lib/generated/admin-panel-version';
import { DESKTOP_CONTENT_PADDING_CLASS } from '@/lib/layout-tokens';
import { fa } from '@/lib/utils';

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

function appVersionLabel(): string {
  return fa(ADMIN_PANEL_VERSION).replace(/\./g, '٫');
}

/** کپی‌رایت، لینک سایت و نسخهٔ اپ در یک ردیف — بدون toLocaleString تا هیدریشن/CLS نشکند */
function WibeBrandLink({ className = '' }: { className?: string }) {
  const year = fa(new Date().getFullYear());
  const version = appVersionLabel();

  return (
    <span
      className={`inline-flex h-11 items-center px-2 text-xs text-muted-foreground ${className}`}
    >
      <span>
        © <span suppressHydrationWarning>{year}</span> وایب
      </span>
      <span className="mx-1.5 text-muted-foreground/40" aria-hidden>
        ·
      </span>
      <a
        href={WIBE_SITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex h-11 items-center gap-1.5 rounded-lg font-semibold text-foreground/80 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        aria-label="wibe.ir"
      >
        wibe.ir
        <ExternalLink
          className="h-3.5 w-3.5 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </a>
      <span className="mx-1.5 text-muted-foreground/40" aria-hidden>
        ·
      </span>
      <span>نسخهٔ {version}</span>
    </span>
  );
}

export default function SiteFooter({ variant = 'desktop' }: SiteFooterProps) {
  if (variant === 'mobile') {
    return (
      <footer
        className="border-t border-border bg-popover px-4 py-3 lg:hidden"
        role="contentinfo"
      >
        <div className="mx-auto flex max-w-sm flex-wrap items-center justify-center">
          <WibeBrandLink />
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`mt-auto hidden min-h-48 border-t border-border bg-popover lg:block ${DESKTOP_CONTENT_PADDING_CLASS}`}
      role="contentinfo"
    >
      <div className="py-8 xl:py-10">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-start">
            <SiteLogo variant="nav" href="/" />
            <p className="max-w-xs text-sm text-muted-foreground">
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
                  <span className="mx-2 text-muted-foreground/40" aria-hidden>
                    ·
                  </span>
                )}
                <Link
                  href={item.href}
                  className="inline-flex h-11 items-center px-1 text-sm font-medium text-foreground/80 transition-colors hover:text-brand"
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center border-t border-border pt-5 lg:justify-start">
          <WibeBrandLink />
        </div>
      </div>
    </footer>
  );
}
