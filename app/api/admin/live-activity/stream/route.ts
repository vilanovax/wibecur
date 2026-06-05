import { checkAdminAuth } from '@/lib/auth';
import { getLiveActivityData, serializeLiveActivity } from '@/lib/admin/live-activity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PUSH_INTERVAL_MS = 12_000;

export async function GET(request: Request) {
  const session = await checkAdminAuth();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const push = async () => {
        if (closed) return;
        try {
          const data = serializeLiveActivity(await getLiveActivityData());
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ data })}\n\n`));
        } catch (err) {
          console.error('Live activity stream error:', err);
          controller.enqueue(encoder.encode(`event: error\ndata: {}\n\n`));
        }
      };

      await push();
      intervalId = setInterval(() => void push(), PUSH_INTERVAL_MS);

      request.signal.addEventListener('abort', () => {
        closed = true;
        if (intervalId) clearInterval(intervalId);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      closed = true;
      if (intervalId) clearInterval(intervalId);
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
