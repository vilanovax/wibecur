import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import PersonPageClient from '@/components/people/PersonPageClient';
import { notFound } from 'next/navigation';
import { isPersonRole, PERSON_ROLE_META } from '@/lib/people';
import { getCachedPersonPage } from '@/lib/people-server';

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string; slug: string }>;
}) {
  const { role, slug } = await params;
  if (!isPersonRole(role)) {
    return { title: 'صفحه یافت نشد' };
  }

  const data = await getCachedPersonPage(role, slug);
  if (!data) {
    return { title: 'صفحه یافت نشد' };
  }

  const roleLabel = PERSON_ROLE_META[role].label;
  return {
    title: `${data.displayName} — ${roleLabel}`,
    description: data.bioIsStub
      ? `آیتم‌های ${roleLabel} ${data.displayName} در وایب`
      : data.bio?.slice(0, 160) ?? `آیتم‌های ${roleLabel} ${data.displayName} در وایب`,
  };
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ role: string; slug: string }>;
}) {
  const { role, slug } = await params;

  if (!isPersonRole(role)) {
    notFound();
  }

  const data = await getCachedPersonPage(role, slug);
  if (!data || data.items.length === 0) {
    notFound();
  }

  const serialized = JSON.parse(JSON.stringify(data)) as typeof data;

  return (
    <div className="bg-wibe-surface">
      <Header showBack hideTitleOnDesktop showDesktopSearch={false} />
      <PersonPageClient {...serialized} />
      <BottomNav />
    </div>
  );
}
