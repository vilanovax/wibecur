import type { BookExtractJobStatus, BookExtractMode, BookExtractSource } from '@prisma/client';
import type { BookExtractProgressMeta } from '@/lib/books/types';

export type SerializedBookExtractJob = {
  id: string;
  status: BookExtractJobStatus;
  mode: BookExtractMode;
  source: BookExtractSource;
  input: unknown;
  options: unknown;
  targetListId: string | null;
  progress: number;
  progressMeta: BookExtractProgressMeta | null;
  resultItems: unknown | null;
  itemCount: number;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  createdBy: { id: string; name: string | null; email: string | null } | null;
};

export function serializeBookExtractJob(job: {
  id: string;
  status: BookExtractJobStatus;
  mode: BookExtractMode;
  source: BookExtractSource;
  input: unknown;
  options: unknown;
  targetListId: string | null;
  progress: number;
  progressMeta: unknown;
  resultItems?: unknown;
  itemCount: number;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
  createdBy?: { id: string; name: string | null; email: string | null } | null;
}): SerializedBookExtractJob {
  return {
    id: job.id,
    status: job.status,
    mode: job.mode,
    source: job.source,
    input: job.input,
    options: job.options,
    targetListId: job.targetListId,
    progress: job.progress,
    progressMeta: (job.progressMeta as BookExtractProgressMeta | null) ?? null,
    resultItems: job.resultItems ?? null,
    itemCount: job.itemCount,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    createdBy: job.createdBy ?? null,
  };
}
