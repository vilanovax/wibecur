import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import type { ParsedBackupBundle } from './parse-archive';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function getImportStorageDir(): string {
  return process.env.BACKUP_IMPORT_DIR || path.join(process.cwd(), '.data', 'backup-imports');
}

function sessionDir(sessionId: string): string {
  return path.join(getImportStorageDir(), sessionId);
}

export function createImportSessionId(): string {
  return nanoid(16);
}

export function saveImportSession(sessionId: string, bundle: ParsedBackupBundle): string {
  const dir = sessionDir(sessionId);
  fs.mkdirSync(dir, { recursive: true });
  const bundlePath = path.join(dir, 'bundle.json');
  // فایل داخلیِ ماشین‌خوان — JSON فشرده (نه pretty) برای صرفه‌جویی دیسک/CPU
  fs.writeFileSync(bundlePath, JSON.stringify(bundle), 'utf-8');
  fs.writeFileSync(
    path.join(dir, 'meta.json'),
    JSON.stringify({
      sessionId,
      fileName: bundle.fileName,
      format: bundle.format,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    }),
    'utf-8'
  );
  pruneOldImportSessions();
  return bundlePath;
}

export function loadImportSession(sessionId: string): ParsedBackupBundle | null {
  const bundlePath = path.join(sessionDir(sessionId), 'bundle.json');
  if (!fs.existsSync(bundlePath)) return null;
  const raw = fs.readFileSync(bundlePath, 'utf-8');
  return JSON.parse(raw) as ParsedBackupBundle;
}

export function deleteImportSession(sessionId: string): void {
  const dir = sessionDir(sessionId);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function pruneOldImportSessions(): void {
  const root = getImportStorageDir();
  if (!fs.existsSync(root)) return;
  const now = Date.now();
  for (const id of fs.readdirSync(root)) {
    const metaPath = path.join(root, id, 'meta.json');
    try {
      if (!fs.existsSync(metaPath)) continue;
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as { expiresAt?: string };
      if (meta.expiresAt && new Date(meta.expiresAt).getTime() < now) {
        fs.rmSync(path.join(root, id), { recursive: true, force: true });
      }
    } catch {
      /* ignore */
    }
  }
}
