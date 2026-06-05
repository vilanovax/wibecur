/** Prisma P1001 / connection errors */
export function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string };
  if (e.code === 'P1001' || e.code === 'P1002' || e.code === 'P1017') return true;
  const msg = e.message ?? '';
  return (
    msg.includes("Can't reach database server") ||
    msg.includes('Connection refused') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('Connection timed out')
  );
}

export function databaseErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'خطا در اتصال به دیتابیس';
}
