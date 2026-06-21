import { requireAdmin } from '@/lib/auth';
import SponsoredPlacementsClient from './SponsoredPlacementsClient';

export const dynamic = 'force-dynamic';

export default async function SponsoredAdminPage() {
  await requireAdmin();
  return <SponsoredPlacementsClient />;
}
