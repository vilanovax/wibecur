interface AuthShellProps {
  children: React.ReactNode;
}

/**
 * ستون فرم را با align-self وسط می‌کند.
 * margin/padding یوتیلیتی‌ها به‌خاطر ریست سراسری اعمال نمی‌شوند؛
 * فاصلهٔ لبه با کلاس important و ریتم داخلی با gap است.
 */
export default function AuthShell({ children }: AuthShellProps) {
  return (
    <div
      className="flex min-h-dvh flex-col bg-background px-4! pt-[max(3rem,env(safe-area-inset-top))]! pb-[max(1.5rem,env(safe-area-inset-bottom))]!"
      dir="rtl"
    >
      <div className="flex w-full max-w-[24rem] flex-1 flex-col self-center">
        <div className="flex flex-1 flex-col justify-center">{children}</div>
      </div>
    </div>
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
