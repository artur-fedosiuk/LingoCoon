import { timingSafeEqual } from 'node:crypto';
import { getReadingTtsStorageConfig } from '@/lib/server/reading-tts/config';
import { cleanupExpiredTts, createTtsStorageClient, drainTtsCleanupQueue } from '@/lib/server/reading-tts/store';

export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const expected = Buffer.from(`Bearer ${secret ?? ''}`);
  const actual = Buffer.from(request.headers.get('authorization') ?? '');
  if (!secret || secret.length < 32 || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return new Response(null, { status: 401 });
  try {
    const client = createTtsStorageClient(getReadingTtsStorageConfig(), AbortSignal.any([request.signal, AbortSignal.timeout(45_000)]));
    const deadline = Date.now() + 40_000;
    let expired = 0; let orphans = 0; let more = true;
    while (more && Date.now() < deadline) {
      const batch = await cleanupExpiredTts(client);
      const queued = await drainTtsCleanupQueue(client);
      expired += batch; orphans += queued; more = batch === 100 || queued === 100;
    }
    console.info('[ReadingTts]', { operation: 'cleanup', expired, orphans, backlog: more });
    return Response.json({ expired, orphans, backlog: more }, { status: more ? 503 : 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    console.warn('[ReadingTts]', { operation: 'cleanup', outcome: 'storage_failure' });
    return Response.json({ code: 'storage_failure' }, { status: 503 });
  }
}
