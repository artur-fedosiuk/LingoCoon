import { getRequiredEnvironmentVariable } from '@/lib/server/environment';

const DEFAULT_OPENAI_STT_MODEL_ID = 'gpt-4o-mini-transcribe';

export function getSttConfig() {
  return {
    apiKey: getRequiredEnvironmentVariable('OPENAI_API_KEY'),
    endpoint: 'https://api.openai.com/v1/audio/transcriptions',
    modelId: process.env.OPENAI_STT_MODEL_ID ?? DEFAULT_OPENAI_STT_MODEL_ID,
  };
}
