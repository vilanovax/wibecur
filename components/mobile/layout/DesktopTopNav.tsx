'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, Loader2 } from 'lucide-react';
import CreateSheet from '@/components/mobile/home/CreateSheet';
import HeaderDesktopSearch from '@/components/mobile/layout/HeaderDesktopSearch';
import HeaderActions, { type HeaderActionsProfile } from '@/components/mobile/layout/HeaderActions';
import { CONSUMER_NAV_ITEMS, isNavItemActive } from '@/components/mobile/layout/consumer-nav-config';
import { DESKTOP_CONTENT_PADDING_CLASS } from '@/lib/layout-tokens';

/**
 * ناوبری افقی دسکتاپ — حس وب‌سایت به‌جای اپ کناری
 */
export default function DesktopTopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [createOpen, setCreateOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState<HeaderActionsProfile | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (data?.success && data?.data?.user) {
        const u = data.data.user;
        setProfile({
          image: u.image ?? null,
          avatarType: u.avatarType ?? null,
          avatarId: u.avatarId ?? null,
          avatarStatus: u.avatarStatus ?? null,
        });
      }
    } catch {
      setProfile(null);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user) fetchProfile();
    else setProfile(null);
  }, [session?.user, fetchProfile]);

  useEffect(() => {
    const onProfileUpdated = () => fetchProfile();
    window.addEventListener('profile-updated', onProfileUpdated);
    return () => window.removeEventListener('profile-updated', onProfileUpdated);
  }, [fetchProfile]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: '/login' });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinkClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 wibe-small font-medium transition-colors whitespace-nowrap ${
      active
        ? 'bg-primary/10 text-primary'
        : 'text-foreground hover:bg-gray-50 hover:text-primary'
    }`;

  return (
    <>
      <header
        className="sticky top-0 z-50 hidden w-full shrink-0 border-b border-wibe/80 bg-white/95 backdrop-blur-md lg:block"
        role="banner"
      >
        <div className={`flex h-[3.5rem] w-full min-w-0 items-center gap-3 ${DESKTOP_CONTENT_PADDING_CLASS}`}>
          <Link
            href="/"
            className="shrink-0 text-right leading-none"
            aria-label="وایب — خانه"
          >
            <span className="text-lg font-bold text-primary">وایب</span>
          </Link>

          <nav
            className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto scrollbar-hide"
            aria-label="منوی اصلی"
          >
            {CONSUMER_NAV_ITEMS.map((item) => {
              if (item.isButton) {
                return (
                  <button
                    key="create"
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition-colors hover:bg-primary-dark"
                    aria-label="ساخت لیست یا آیتم"
                    title="ساخت"
                  >
                    {item.icon}
                  </button>
                );
              }
              const active = item.href ? isNavItemActive(pathname, item.href) : false;
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`${navLinkClass(active)} ${item.iconOnly ? 'px-2.5' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.iconOnly ? item.label : undefined}
                  title={item.iconOnly ? item.label : undefined}
                >
                  {item.icon}
                  {!item.iconOnly ? item.label : null}
                </Link>
              );
            })}
          </nav>

          <div className="hidden min-w-0 max-w-sm flex-1 lg:flex lg:max-w-md">
            <HeaderDesktopSearch />
          </div>

          <div className="flex shrink-0 items-center gap-1 border-s border-wibe/60 ps-2">
            <HeaderActions profile={profile} />
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 wibe-caption font-medium text-wibe-secondary transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              aria-label="خروج از حساب"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden />
              )}
              <span className="hidden 2xl:inline">{isLoggingOut ? 'در حال خروج…' : 'خروج'}</span>
            </button>
          </div>
        </div>
      </header>

      <CreateSheet isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
