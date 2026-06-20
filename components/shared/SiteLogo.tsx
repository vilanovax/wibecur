'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSiteBranding } from '@/contexts/SiteBrandingContext';

type SiteLogoProps = {
  href?: string;
  /** header = موبایل | nav = دسکتاپ | admin = سایدبار ادمین */
  variant?: 'header' | 'nav' | 'admin' | 'adminCompact';
  className?: string;
  showFallbackText?: boolean;
  fallbackText?: string;
  onClick?: () => void;
  linked?: boolean;
};

const VARIANT_CLASS: Record<NonNullable<SiteLogoProps['variant']>, string> = {
  header: 'h-8 max-w-[120px]',
  nav: 'h-9 max-w-[140px]',
  admin: 'h-8 max-w-[128px]',
  adminCompact: 'h-8 w-8',
};

export default function SiteLogo({
  href = '/',
  variant = 'nav',
  className = '',
  showFallbackText = true,
  fallbackText = 'وایب',
  onClick,
  linked = true,
}: SiteLogoProps) {
  const { logoDisplayUrl } = useSiteBranding();
  const sizeClass = VARIANT_CLASS[variant];
  const isCompact = variant === 'adminCompact';

  const inner = logoDisplayUrl ? (
    <Image
      src={logoDisplayUrl}
      alt={fallbackText}
      width={480}
      height={120}
      unoptimized
      className={`object-contain object-right ${isCompact ? 'h-8 w-8' : `${sizeClass} w-auto`}`}
      priority={variant === 'nav' || variant === 'header'}
    />
  ) : showFallbackText ? (
    <span
      className={`font-bold text-primary leading-none ${
        variant === 'header' ? 'text-xl' : variant === 'admin' ? 'text-sm' : 'text-lg'
      }`}
    >
      {fallbackText}
    </span>
  ) : (
    <span
      className={`flex items-center justify-center rounded-lg bg-primary/10 font-bold text-primary ${
        isCompact ? 'h-8 w-8 text-xs' : 'h-8 min-w-8 px-2 text-sm'
      }`}
    >
      {fallbackText.slice(0, 1)}
    </span>
  );

  const linkClass = `inline-flex shrink-0 items-center ${className}`;

  if (!linked) {
    return <span className={linkClass}>{inner}</span>;
  }

  if (onClick) {
    return (
      <Link href={href} onClick={onClick} className={linkClass} aria-label={`${fallbackText} — خانه`}>
        {inner}
      </Link>
    );
  }

  return (
    <Link href={href} className={linkClass} aria-label={`${fallbackText} — خانه`}>
      {inner}
    </Link>
  );
}
