import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit/log';
import type { UserRole } from '@prisma/client';
import { exportScopeData } from './export-scope-data';
import { buildMediaManifest } from './media-manifest';
import { writeBackupArchive } from './create-archive';
import {
  buildBackupFileName,
  ensureBackupDir,
  pruneOldBackupFiles,
  resolveBackupFilePath,
} from './storage';
import { BACKUP_SECRETS_EXCLUDED } from './sanitize';
import {
  type BackupManifestV1,
  type BackupRequestOptions,
  normalizeBackupScopes,
  resolveScopes,
} from './types';

function countStats(dataFiles: Record<string, unknown[]>): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const [k, v] of Object.entries(dataFiles)) {
    stats[k] = Array.isArray(v) ? v.length : 0;
  }
  stats._totalRows = Object.values(stats).reduce((a, b) => a + b, 0);
  return stats;
}

export async function runBackupJob(
  jobId: string,
  actor: { id: string; role: UserRole }
): Promise<void> {
  const job = await prisma.backup_jobs.findUnique({ where: { id: jobId } });
  if (!job) return;

  const rawScopes = Array.isArray(job.scopes)
    ? (job.scopes as string[]).filter((s): s is BackupRequestOptions['scopes'][number] =>
        typeof s === 'string'
      )
    : [];

  const request: BackupRequestOptions = {
    scopes: resolveScopes(normalizeBackupScopes(rawScopes)),
    assetMode: job.assetMode === 'urls_only' ? 'urls_only' : 'none',
    includeTrash: job.includeTrash,
  };

  try {
    await prisma.backup_jobs.update({
      where: { id: jobId },
      data: { status: 'RUNNING', progress: 5 },
    });

    const dataFiles = await exportScopeData(request.scopes, request.includeTrash);
    await prisma.backup_jobs.update({
      where: { id: jobId },
      data: { progress: 45 },
    });

    const stats = countStats(dataFiles);
    const mediaManifest =
      request.assetMode === 'urls_only' ? buildMediaManifest(dataFiles) : undefined;

    if (request.assetMode === 'urls_only' && mediaManifest) {
      stats.mediaUrls = mediaManifest.length;
    }

    const manifest: BackupManifestV1 = {
      version: 1,
      app: 'WibeCur',
      createdAt: new Date().toISOString(),
      createdById: actor.id,
      options: request,
      stats,
      tables: Object.keys(dataFiles).sort(),
      secretsExcluded: [...BACKUP_SECRETS_EXCLUDED],
      notes: [
        'فاز ۱: داده JSON + manifest؛ بدون دانلود باینری تصاویر.',
        request.assetMode === 'urls_only'
          ? 'media-manifest.json شامل URLهای تصویر است.'
          : 'حالت رسانه: فقط داده ساختاری.',
      ],
    };

    await prisma.backup_jobs.update({
      where: { id: jobId },
      data: { progress: 70, manifest: manifest as object },
    });

    ensureBackupDir();
    const fileName = buildBackupFileName(jobId);
    const filePath = resolveBackupFilePath(fileName);

    const { format, sizeBytes } = await writeBackupArchive({
      outputPath: filePath,
      manifest,
      dataFiles,
      mediaManifest,
    });

    const finalName = format === 'json' ? fileName.replace(/\.zip$/, '.json') : fileName;
    const finalPath = resolveBackupFilePath(finalName);

    await prisma.backup_jobs.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        fileName: finalName,
        filePath: finalPath,
        fileSizeBytes: BigInt(sizeBytes),
        stats: stats as object,
        manifest: manifest as object,
        completedAt: new Date(),
        errorMessage: null,
      },
    });

    pruneOldBackupFiles();

    await logAudit({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'backup.create',
      entityType: 'backup_job',
      entityId: jobId,
      after: { fileName: finalName, stats, scopes: request.scopes },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطای ناشناخته';
    console.error('[backup] job failed:', jobId, err);
    await prisma.backup_jobs.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMessage: message,
        completedAt: new Date(),
      },
    });
  }
}
