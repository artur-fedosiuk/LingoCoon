import { createTtsHandler } from '@/lib/server/reading-tts/handler';
import { authenticateTts, openTts } from '@/lib/server/reading-tts/runtime';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  return createTtsHandler({
    authenticate: authenticateTts,
    open: (input, owner, _ip, lease, signal) => openTts(request, input, owner, lease, signal),
  })(request);
}
