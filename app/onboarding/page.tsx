import { auth } from '@/lib/auth-config';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import OnboardingClient from './OnboardingClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'سلیقه‌تو بگو | WibeCur',
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as { id: string }).id;
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { onboardingCompleted: true, name: true },
  });

  // If already completed, go home
  if (user?.onboardingCompleted) {
    redirect('/');
  }

  return <OnboardingClient userName={user?.name ?? null} />;
}
