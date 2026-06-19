import type { Metadata } from 'next';
import Image from 'next/image';
import { getMaintenancePageConfig } from '@/lib/maintenance-mode';
import SiteMaintenancePage from '@/components/site/SiteMaintenancePage';

export const metadata: Metadata = {
  title: 'به‌زودی برمی‌گردیم',
  robots: { index: false, follow: false },
};

export default async function MaintenanceRoutePage() {
  const config = await getMaintenancePageConfig();
  return <SiteMaintenancePage config={config} />;
}
