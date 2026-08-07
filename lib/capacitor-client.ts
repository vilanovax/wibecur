'use client';

type CapWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
  };
};

/** اجرا داخل shell اندروید/iOS — بدون import پکیج Capacitor (تا وب bundle سبک بماند). */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as CapWindow).Capacitor?.isNativePlatform?.());
}

export function getNativePlatform(): 'android' | 'ios' | 'web' {
  if (typeof window === 'undefined') return 'web';
  const platform = (window as CapWindow).Capacitor?.getPlatform?.() ?? 'web';
  if (platform === 'android' || platform === 'ios') return platform;
  return 'web';
}
