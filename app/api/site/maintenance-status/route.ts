import { NextResponse } from 'next/server';
import { getMaintenancePageConfig } from '@/lib/maintenance-mode';

export const dynamic = 'force-dynamic';

/** وضعیت حالت اضطراری — برای middleware و کلاینت */
export async function GET() {
  const config = await getMaintenancePageConfig();

  return NextResponse.json(
    {
      enabled: config.enabled,
      allowAdminBrowse: config.allowAdminBrowse,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    }
  );
}
