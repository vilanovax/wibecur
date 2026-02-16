import { requireAdmin } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import TrendingDebugRuntimeContent from '@/components/admin/lists/TrendingDebugRuntimeContent';

export default async function ListDebugPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const list = await prisma.lists.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!list) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
        <Link href="/admin/lists" className="hover:text-[var(--primary)]">
          لیست‌ها
        </Link>
        <span>/</span>
        <Link href={`/admin/lists/${id}/edit`} className="hover:text-[var(--primary)]">
          ویرایش
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text)]">دیباگ ترند (Runtime)</span>
      </div>
      <TrendingDebugRuntimeContent listId={id} />
    </div>
  );
}
