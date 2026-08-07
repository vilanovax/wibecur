'use client';

import { createContext, useContext } from 'react';

type SiteBrandingContextValue = {
  /** URL خام ذخیره‌شده در تنظیمات */
  logoUrl: string | null;
  /** URL آماده نمایش (proxy/storage) */
  logoDisplayUrl: string | null;
};

const SiteBrandingContext = createContext<SiteBrandingContextValue>({
  logoUrl: null,
  logoDisplayUrl: null,
});

export function SiteBrandingProvider({
  logoUrl,
  logoDisplayUrl,
  children,
}: {
  logoUrl: string | null;
  logoDisplayUrl: string | null;
  children: React.ReactNode;
}) {
  return (
    <SiteBrandingContext.Provider value={{ logoUrl, logoDisplayUrl }}>
      {children}
    </SiteBrandingContext.Provider>
  );
}

export function useSiteBranding() {
  return useContext(SiteBrandingContext);
}
