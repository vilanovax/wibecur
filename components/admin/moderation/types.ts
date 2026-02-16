/**
 * Shared types and labels for Moderation Queue
 */

export interface ModerationCaseRow {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  reason: string;
  severity: number;
  status: string;
  reportCount: number;
  metadata: unknown;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  users: { id: string; name: string | null; email: string | null; image?: string | null } | null;
  entityPreview?: { title?: string; categoryName?: string; name?: string; email?: string; role?: string; body?: string } | null;
}

export interface ModerationNoteRow {
  id: string;
  body: string;
  createdAt: string;
  users: { id: string; name: string | null; email: string | null } | null;
}

export interface ModerationCaseDetail extends ModerationCaseRow {
  notes: ModerationNoteRow[];
}

export interface ModerationSummary {
  open: number;
  inReview: number;
  highSeverity: number;
  resolvedToday: number;
}

export type EntityPreview =
  | { kind: 'LIST'; id: string; title: string | null; slug: string | null; saveCount: number; likeCount: number; itemCount: number; createdAt: string; deletedAt: string | null; isActive: boolean; categories?: { name: string; slug: string } }
  | { kind: 'USER'; id: string; name: string | null; email: string; role: string; isActive: boolean; deletedAt: string | null; createdAt: string }
  | { kind: 'COMMENT'; id: string; content: string; isApproved: boolean; deletedAt: string | null; createdAt: string; likeCount: number; users?: { name: string | null; email: string | null } }
  | { kind: 'CATEGORY'; id: string; name: string; slug: string; isActive: boolean; deletedAt: string | null; _count?: { lists: number } }
  | null;

export interface ModerationFiltersState {
  type: string;
  entityType: string;
  status: string;
  severity: string;
  assigneeFilter: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  page: string;
}

export const TYPE_LABELS: Record<string, string> = {
  REPORT: 'Report',
  AUTO_FLAG: 'Auto Flag',
  ANOMALY: 'Anomaly',
  PENDING: 'Pending',
};

export const ENTITY_LABELS: Record<string, string> = {
  LIST: 'لیست',
  COMMENT: 'کامنت',
  USER: 'کاربر',
  CATEGORY: 'دسته',
};

export const STATUS_LABELS: Record<string, string> = {
  OPEN: 'باز',
  IN_REVIEW: 'در حال بررسی',
  RESOLVED: 'حل‌شده',
  IGNORED: 'نادیده',
};

export const SEVERITY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
};

export const TYPE_BADGE_CLASS: Record<string, string> = {
  REPORT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  AUTO_FLAG: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  ANOMALY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  PENDING: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
};

export const STATUS_BADGE_CLASS: Record<string, string> = {
  OPEN: 'border border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700',
  IN_REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  RESOLVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  IGNORED: 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300',
};

/** Plan: severity 1 → gray, 2 → amber, 3 → red */
export const SEVERITY_BADGE_CLASS: Record<number, string> = {
  1: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
  2: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  3: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};
