import { NextResponse } from 'next/server';
import { getMaintenanceModeSettings } from '@/lib/maintenance-mode';

export const dynamic = 'force-dynamic';

/** وضعیت حالت اضطراری — برای middleware و کلاینت */
export async function GET() {
  const settings = await getMaintenanceModeSettings();

  return NextResponse.json(
    {
      enabled: settings.enabled,
      allowAdminBrowse: settings.allowAdminBrowse,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
