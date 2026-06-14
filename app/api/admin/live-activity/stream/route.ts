import { checkAdminAuth } from '@/lib/auth';
import { getCachedLiveActivity } from '@/lib/admin/live-activity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PUSH_INTERVAL_MS = 12_000;
const HEARTBEAT_MS = 20_000;
// بستن دوره‌ای اتصال تا روی serverless/پراکسی، اتصال‌های idle انباشته/مرده نشوند؛
// مرورگر به‌صورت خودکار دوباره وصل می‌شود (EventSource).
const MAX_DURATION_MS = 5 * 60_000;

export async function GET(request: Request) {
  const session = await checkAdminAuth();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let pushId: ReturnType<typeof setInterval> | undefined;
  let heartbeatId: ReturnType<typeof setInterval> | undefined;
  let maxTimer: ReturnType<typeof setTimeout> | undefined;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const cleanup = () => {
        closed = true;
        if (pushId) clearInterval(pushId);
        if (heartbeatId) clearInterval(heartbeatId);
        if (maxTimer) clearTimeout(maxTimer);
      };
      const safeEnqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };

      // فاصلهٔ تلاش مجدد سمت کلاینت
      safeEnqueue('retry: 5000\n\n');

      const push = async () => {
        if (closed) return;
        try {
          const data = await getCachedLiveActivity();
          safeEnqueue(`data: ${JSON.stringify({ data })}\n\n`);
        } catch (err) {
          console.error('Live activity stream error:', err);
          safeEnqueue('event: error\ndata: {}\n\n');
        }
      };

      await push();
      pushId = setInterval(() => void push(), PUSH_INTERVAL_MS);
      // heartbeat تا اتصال idle توسط پراکسی کشته نشود
      heartbeatId = setInterval(() => safeEnqueue(': keepalive\n\n'), HEARTBEAT_MS);
      maxTimer = setTimeout(() => {
        cleanup();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }, MAX_DURATION_MS);

      request.signal.addEventListener('abort', () => {
        cleanup();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      closed = true;
      if (pushId) clearInterval(pushId);
      if (heartbeatId) clearInterval(heartbeatId);
      if (maxTimer) clearTimeout(maxTimer);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
