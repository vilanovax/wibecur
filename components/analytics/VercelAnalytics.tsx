'use client';

import dynamic from 'next/dynamic';

const Analytics = dynamic(
  () => import('@vercel/analytics/react').then((mod) => mod.Analytics),
  { ssr: false },
);

/** فقط روی Vercel — در localhost اسکریپت /_vercel/insights وجود ندارد */
export default function VercelAnalytics() {
  if (process.env.NEXT_PUBLIC_VERCEL !== '1') return null;
  return <Analytics />;
}
