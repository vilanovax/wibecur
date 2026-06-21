import type { Metadata } from 'next';
import { getMaintenanceModeSettings } from '@/lib/maintenance-mode';
import { getSiteBrandingForLayout } from '@/lib/site-branding';
import { toAbsoluteImageUrl } from '@/lib/seo';
import SiteMaintenancePage from '@/components/site/SiteMaintenancePage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'به‌زودی برمی‌گردیم',
  robots: { index: false, follow: false },
};

export default async function MaintenanceRoutePage() {
  const [settings, { logoUrl }] = await Promise.all([
    getMaintenanceModeSettings(),
    getSiteBrandingForLayout(),
  ]);
  const rawLogo = logoUrl?.trim();

  return (
    <SiteMaintenancePage
      config={{
        title: settings.title,
        subtitle: settings.subtitle || null,
        message: settings.message,
        showLogo: settings.showLogo,
        accentColor: settings.accentColor,
        logoUrl: settings.showLogo && rawLogo ? toAbsoluteImageUrl(rawLogo) ?? rawLogo : null,
      }}
    />
  );
}
