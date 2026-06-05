import fs from 'fs';
import path from 'path';

const MAX_STORED_JOBS = 10;

export function getBackupStorageDir(): string {
  return process.env.BACKUP_STORAGE_DIR || path.join(process.cwd(), '.data', 'backups');
}

export function ensureBackupDir(): string {
  const dir = getBackupStorageDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function buildBackupFileName(jobId: string): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `wibecur-backup-${stamp}-${jobId.slice(0, 8)}.zip`;
}

export function resolveBackupFilePath(fileName: string): string {
  return path.join(getBackupStorageDir(), fileName);
}

/** حذف فایل‌های قدیمی‌تر از نگه‌داری مجاز */
export function pruneOldBackupFiles(keep = MAX_STORED_JOBS): void {
  const dir = getBackupStorageDir();
  if (!fs.existsSync(dir)) return;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.zip') || f.endsWith('.json'))
    .map((f) => ({
      name: f,
      path: path.join(dir, f),
      mtime: fs.statSync(path.join(dir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  for (const f of files.slice(keep)) {
    try {
      fs.unlinkSync(f.path);
    } catch {
      /* ignore */
    }
  }
}
