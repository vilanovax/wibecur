export type UserFilterKind =
  | 'all'
  | 'most_active'
  | 'growing'
  | 'curators'
  | 'suspicious'
  | 'new';

export const USER_FILTER_PILLS: { value: UserFilterKind; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'most_active', label: 'فعال‌ترین' },
  { value: 'growing', label: 'در حال رشد' },
  { value: 'curators', label: 'کیوریتورها' },
  { value: 'suspicious', label: 'مشکوک' },
  { value: 'new', label: 'جدیدها' },
];

const VALID_FILTERS = new Set(USER_FILTER_PILLS.map((p) => p.value));

export function parseUserFilter(value: string | undefined): UserFilterKind {
  if (value && VALID_FILTERS.has(value as UserFilterKind)) {
    return value as UserFilterKind;
  }
  return 'all';
}

export type UserPulseFilterKey =
  | 'activeUsers7d'
  | 'highGrowthCount'
  | 'curatorCandidatesCount'
  | 'suspiciousCount';

export const PULSE_TO_FILTER: Record<UserPulseFilterKey, UserFilterKind> = {
  activeUsers7d: 'most_active',
  highGrowthCount: 'growing',
  curatorCandidatesCount: 'curators',
  suspiciousCount: 'suspicious',
};
