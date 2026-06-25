'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isNativeApp } from '@/lib/capacitor-client';

const ADMIN_PREFIX = '/admin';

/**
 * رفتار native اندروید: status bar، splash، دکمه back، مسدود کردن پنل ادمین.
 */
export default function CapacitorProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;

    let removeBackListener: (() => void) | undefined;

    const hideSplash = async () => {
      try {
        await SplashScreen.hide();
      } catch {
        /* ignore */
      }
    };

    if (document.readyState === 'complete') {
      void hideSplash();
    } else {
      window.addEventListener('load', () => {
        void hideSplash();
      }, { once: true });
    }

    const init = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#6366F1' });
      } catch {
        /* StatusBar در وب موجود نیست */
      }

      const handle = await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
          return;
        }
        void App.exitApp();
      });
      removeBackListener = () => {
        void handle.remove();
      };
    };

    void init();

    return () => {
      removeBackListener?.();
    };
  }, []);

  useEffect(() => {
    if (!isNativeApp()) return;
    if (!pathname?.startsWith(ADMIN_PREFIX)) return;
    router.replace('/');
  }, [pathname, router]);

  return <>{children}</>;
}
