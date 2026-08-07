import type { ImageProfile } from '@/lib/image-config';

export type ListCoverField = 'coverImage' | 'horizontalImage';

export type CoverUrgency = 'none' | 'low' | 'medium' | 'high' | 'critical';

export type ListCoverImageAudit = {
  listId: string;
  listTitle: string;
  listSlug: string;
  categoryName: string;
  categoryIcon: string;
  field: ListCoverField;
  fieldLabel: string;
  url: string | null;
  profile: ImageProfile;
  bytes: number | null;
  width: number | null;
  height: number | null;
  contentType: string | null;
  onStorage: boolean;
  urgency: CoverUrgency;
  issues: string[];
  optimizable: boolean;
  maxBytes: number;
  maxWidth: number;
  maxHeight: number;
};

export type CoverAuditSummary = {
  totalSlots: number;
  missing: number;
  urgent: number;
  totalBytes: number;
  optimizable: number;
};

export const URGENCY_RANK: Record<CoverUrgency, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  none: 1,
};

export function formatCoverBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function isUrgentAudit(item: ListCoverImageAudit): boolean {
  return URGENCY_RANK[item.urgency] >= URGENCY_RANK.medium;
}
