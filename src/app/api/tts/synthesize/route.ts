import { createWavTtsHandler } from '@/lib/server/reading-tts/compatibility';
import { authenticateTts, openTts } from '@/lib/server/reading-tts/runtime';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const POST = createWavTtsHandler({ authenticate: authenticateTts, open: openTts });
