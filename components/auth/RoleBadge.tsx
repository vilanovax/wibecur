'use client';

import { useSession } from 'next-auth/react';
import { isAdminRole, ROLE_LABELS } from '@/lib/auth/roles';
import Badge from '@/components/admin/design-system/Badge';

interface RoleBadgeProps {
  /** اگر ندهی از session خوانده می‌شود */
  role?: string;
  className?: string;
}

export default function RoleBadge({ role: roleProp, className = '' }: RoleBadgeProps) {
  const { data: session } = useSession();
  const role = roleProp ?? session?.user?.role ?? '';
  const label = ROLE_LABELS[role] ?? role;

  if (!role) return null;

  const isAdmin = isAdminRole(role);
  const variant = role === 'SUPER_ADMIN' ? 'danger' : role === 'ADMIN' ? 'trending' : 'neutral';

  return (
    <Badge variant={isAdmin ? variant : 'neutral'} className={className}>
      {label}
    </Badge>
  );
}
