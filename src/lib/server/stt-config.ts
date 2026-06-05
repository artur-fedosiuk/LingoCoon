import { getRequiredEnvironmentVariable } from '@/lib/server/environment';

const DEFAULT_GROQ_STT_MODEL_ID = 'whisper-large-v3';

export function getGroqSttConfig() {
  return {
    apiKey: getRequiredEnvironmentVariable('GROQ_API_KEY'),
    endpoint: 'https://api.groq.com/openai/v1/audio/transcriptions',
    modelId: process.env.GROQ_STT_MODEL_ID ?? DEFAULT_GROQ_STT_MODEL_ID,
  };
}
