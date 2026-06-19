import { headers } from 'next/headers';
import { auth } from '@/lib/auth-config';
import {
  getMaintenancePageConfig,
  isAdminRole,
  isMaintenanceBypassPath,
} from '@/lib/maintenance-mode';
import SiteMaintenancePage from '@/components/site/SiteMaintenancePage';

export default async function MaintenanceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getMaintenancePageConfig();
  if (!config.enabled) {
    return children;
  }

  const pathname = (await headers()).get('x-pathname') || '/';
  if (isMaintenanceBypassPath(pathname)) {
    return children;
  }

  const session = await auth();
  if (config.allowAdminBrowse && isAdminRole(session?.user?.role)) {
    return children;
  }

  return <SiteMaintenancePage config={config} />;
}
