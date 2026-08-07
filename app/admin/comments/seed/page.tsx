import { requireAdmin } from '@/lib/auth';
import CommentSeedPageClient from '@/components/admin/comments/seed/CommentSeedPageClient';

export default async function CommentSeedPage() {
  await requireAdmin();
  return <CommentSeedPageClient />;
}
