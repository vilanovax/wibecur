import { headers } from 'next/headers';
import { connection } from 'next/server';
import { auth } from '@/lib/auth-config';
import {
  getMaintenanceModeSettings,
  isAdminRole,
  isMaintenanceBypassPath,
} from '@/lib/maintenance-mode';
import SiteMaintenancePage from '@/components/site/SiteMaintenancePage';
import AdminMaintenancePreviewBanner from '@/components/site/AdminMaintenancePreviewBanner';
import { getSiteBrandingForLayout } from '@/lib/site-branding';
import { toAbsoluteImageUrl } from '@/lib/seo';

export default async function MaintenanceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const settings = await getMaintenanceModeSettings();
  if (!settings.enabled) {
    return children;
  }

  const pathname = (await headers()).get('x-pathname') || '/';
  if (isMaintenanceBypassPath(pathname)) {
    return children;
  }

  const session = await auth();
  if (settings.allowAdminBrowse && isAdminRole(session?.user?.role)) {
    return (
      <>
        <AdminMaintenancePreviewBanner />
        {children}
      </>
    );
  }

  const { logoUrl } = await getSiteBrandingForLayout();
  const rawLogo = logoUrl?.trim();
  const config = {
    title: settings.title,
    subtitle: settings.subtitle || null,
    message: settings.message,
    showLogo: settings.showLogo,
    accentColor: settings.accentColor,
    logoUrl: settings.showLogo && rawLogo ? toAbsoluteImageUrl(rawLogo) ?? rawLogo : null,
  };

  return <SiteMaintenancePage config={config} />;
}
