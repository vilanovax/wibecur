import { NextResponse } from 'next/server';
import { getMaintenancePageConfig } from '@/lib/maintenance-mode';

export const dynamic = 'force-dynamic';

/** وضعیت حالت اضطراری — برای middleware و کلاینت */
export async function GET() {
  try {
    const config = await getMaintenancePageConfig();

    return NextResponse.json(
      {
        enabled: config.enabled,
        allowAdminBrowse: config.allowAdminBrowse,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
        },
      }
    );
  } catch {
    // fail-open: اگر DB در دسترس نبود، سایت قفل نشود
    return NextResponse.json(
      { enabled: false, allowAdminBrowse: true },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
