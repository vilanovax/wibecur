'use client';

import { Capacitor } from '@capacitor/core';

/** اجرا داخل shell اندروید/iOS (نه مرورگر وب) */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function getNativePlatform(): 'android' | 'ios' | 'web' {
  return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
}
