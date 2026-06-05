/** JSON-safe shape for backup job API responses (BigInt / Date) */
export function serializeBackupJob(job: {
  id: string;
  status: string;
  scopes: unknown;
  assetMode: string;
  includeTrash: boolean;
  fileName: string | null;
  fileSizeBytes: bigint | null;
  progress: number;
  errorMessage: string | null;
  stats: unknown;
  createdAt: Date;
  completedAt: Date | null;
  createdBy: { id: string; name: string | null; email: string | null };
}) {
  return {
    id: job.id,
    status: job.status,
    scopes: job.scopes,
    assetMode: job.assetMode,
    includeTrash: job.includeTrash,
    fileName: job.fileName,
    fileSizeBytes: job.fileSizeBytes != null ? Number(job.fileSizeBytes) : null,
    progress: job.progress,
    errorMessage: job.errorMessage,
    stats: sanitizeJsonValue(job.stats),
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    createdBy: job.createdBy,
  };
}

function sanitizeJsonValue(value: unknown): unknown {
  if (value == null) return value;
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? Number(v) : v))
  );
}
