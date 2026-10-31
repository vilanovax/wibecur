import Image from 'next/image';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthShellProps {
  children: React.ReactNode;
  /** برای کپی و aria پنل ویژوال */
  mode?: 'login' | 'register';
}

const AUTH_COLLAGE = [
  {
    src: '/images/banners/cafe.webp',
    className:
      'start-4 top-6 z-20 w-2/5 -rotate-6 shadow-overlay sm:start-8 lg:start-12 lg:top-20 lg:w-1/2',
  },
  {
    src: '/images/banners/movies.webp',
    className:
      'end-2 top-10 z-10 w-1/2 rotate-6 shadow-overlay sm:end-6 sm:w-2/5 lg:end-8 lg:top-28 lg:w-1/2',
  },
  {
    src: '/images/banners/books.webp',
    className:
      'start-16 bottom-4 z-30 w-2/5 rotate-2 shadow-overlay sm:bottom-6 lg:start-24 lg:bottom-20 lg:w-1/2',
  },
] as const;

/**
 * شِل احراز هویت: اتمسفر برند + پنل ویژوال محصول (موبایل نوار بالا، دسکتاپ ستون کنار فرم).
 * margin/padding یوتیلیتی‌ها به‌خاطر ریست سراسری با ! اعمال می‌شوند.
 */
export default function AuthShell({ children, mode = 'login' }: AuthShellProps) {
  const isRegister = mode === 'register';

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-background" dir="rtl">
      <AuthAtmosphere />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col lg:flex-row lg:items-stretch">
        {/* فرم اول در DOM → در RTL سمت شروع (راست) */}
        <div className="flex w-full flex-1 flex-col px-4! pt-4! pb-[max(1.5rem,env(safe-area-inset-bottom))]! lg:max-w-md lg:px-8! lg:pt-8! lg:pb-8! xl:max-w-lg">
          <div className="flex w-full max-w-sm flex-1 flex-col self-center lg:max-w-none">
            <div className="flex flex-1 flex-col justify-center py-4! lg:py-0!">{children}</div>
          </div>
        </div>

        <AuthVisualPane isRegister={isRegister} />
      </div>
    </div>
  );
}

function AuthAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(
              ellipse 80% 55% at 100% 0%,
              color-mix(in oklch, var(--brand) 16%, transparent),
              transparent 60%
            ),
            radial-gradient(
              ellipse 70% 50% at 0% 100%,
              color-mix(in oklch, var(--brand) 10%, transparent),
              transparent 55%
            ),
            linear-gradient(
              180deg,
              color-mix(in oklch, var(--muted) 70%, transparent),
              transparent 40%,
              color-mix(in oklch, var(--muted) 40%, transparent)
            )
          `,
        }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(
            color-mix(in oklch, var(--foreground) 8%, transparent) 0.8px,
            transparent 0.8px
          )`,
          backgroundSize: '16px 16px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
        }}
      />
    </div>
  );
}

function AuthVisualPane({ isRegister }: { isRegister: boolean }) {
  return (
    <aside
      className={cn(
        'relative shrink-0 overflow-hidden',
        // موبایل: order-first می‌آورد بالا؛ دسکتاپ کنار فرم (سمت پایان در RTL)
        'order-first h-44 w-full pt-[env(safe-area-inset-top)] sm:h-52',
        'lg:order-none lg:h-auto lg:min-h-dvh lg:w-auto lg:flex-1 lg:pt-0',
      )}
      aria-label="نمای محصول وایب"
    >
      <div
        className={cn(
          'relative h-full w-full overflow-hidden',
          'border-b border-border bg-muted',
          'lg:border-b-0 lg:border-s lg:rounded-none',
          'rounded-b-3xl lg:rounded-none',
        )}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(
                160deg,
                color-mix(in oklch, var(--primary) 92%, var(--brand)),
                color-mix(in oklch, var(--primary) 75%, transparent)
              )
            `,
          }}
          aria-hidden
        />

        <div className="absolute inset-0" aria-hidden>
          {AUTH_COLLAGE.map((tile) => (
            <div
              key={tile.src}
              className={cn(
                'absolute aspect-3/4 overflow-hidden rounded-2xl border border-border/40 bg-popover',
                tile.className,
              )}
            >
              <Image
                src={tile.src}
                alt=""
                fill
                sizes="(max-width: 1024px) 45vw, 240px"
                className="object-cover"
                priority
              />
            </div>
          ))}
        </div>

        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(
                to top,
                color-mix(in oklch, var(--primary) 78%, transparent) 0%,
                transparent 48%
              )
            `,
          }}
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4! text-primary-foreground sm:p-5! lg:gap-3 lg:p-8!">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-brand lg:size-12">
              <Bookmark
                className="size-5 fill-brand-foreground text-brand-foreground lg:size-6"
                strokeWidth={2}
                aria-hidden
              />
            </div>
            <p className="wibe-h3 text-primary-foreground">وایب</p>
          </div>
          <p className="max-w-xs text-pretty wibe-small text-primary-foreground/85 lg:wibe-body">
            {isRegister
              ? 'لیست‌های خوب را ذخیره کن و کشف را از جایی که دوست داری شروع کن.'
              : 'لیست‌های خوب را پیدا کن، ذخیره کن، بعداً برگرد.'}
          </p>
        </div>
      </div>
    </aside>
  );
}

export function AuthPageFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background" dir="rtl">
      <div
        className="size-10 animate-spin rounded-full border-2 border-border border-t-brand"
        aria-hidden
      />
      <span className="sr-only">در حال بارگذاری</span>
    </div>
  );
}
