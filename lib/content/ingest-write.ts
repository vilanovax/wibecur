import { NextResponse } from 'next/server';
import {
  beginIdempotency,
  completeIdempotency,
  hashIngestBody,
  readIdempotencyKey,
} from '@/lib/content/ingest-idempotency';
import { authorizeIngest } from '@/lib/content/ingest-auth';
import { publicIngestError } from '@/lib/content/ingest-http';

type WriteResult = {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
};

/**
 * احراز هویت + Idempotency-Key برای endpointهای نوشتنی ingest.
 */
export async function runIngestWrite(
  request: Request,
  path: string,
  rawBody: unknown,
  handler: () => Promise<WriteResult>
): Promise<NextResponse> {
  const authResult = authorizeIngest(request);
  if (!authResult.ok) {
    return NextResponse.json({ ok: false, error: authResult.error }, { status: authResult.status });
  }

  const idemKey = readIdempotencyKey(request);
  if (!idemKey.ok) {
    return NextResponse.json(
      { ok: false, code: idemKey.code, error: idemKey.error },
      { status: idemKey.status }
    );
  }

  const bodyHash = hashIngestBody(rawBody);
  const begun = await beginIdempotency({
    method: request.method.toUpperCase(),
    path,
    key: idemKey.key,
    bodyHash,
  });
  if (!begun.ok) {
    return NextResponse.json(
      { ok: false, code: begun.code, error: begun.error },
      { status: begun.status }
    );
  }
  if (!begun.fresh) {
    return NextResponse.json(begun.record.body, {
      status: begun.record.status || 200,
      headers: { 'Idempotent-Replayed': 'true', ...(begun.record.status ? {} : {}) },
    });
  }

  try {
    const result = await handler();
    await completeIdempotency({
      method: request.method.toUpperCase(),
      path,
      key: idemKey.key,
      bodyHash,
      status: result.status,
      body: result.body,
    });
    return NextResponse.json(result.body, {
      status: result.status,
      headers: result.headers,
    });
  } catch (error) {
    console.error('ingest write:', path, error);
    const body = { ok: false, error: publicIngestError(error) };
    await completeIdempotency({
      method: request.method.toUpperCase(),
      path,
      key: idemKey.key,
      bodyHash,
      status: 500,
      body,
    });
    return NextResponse.json(body, { status: 500 });
  }
}

export async function requireIngestAuth(request: Request): Promise<NextResponse | null> {
  const authResult = authorizeIngest(request);
  if (!authResult.ok) {
    return NextResponse.json({ ok: false, error: authResult.error }, { status: authResult.status });
  }
  return null;
}
