import { getRequiredEnvironmentVariable } from '@/lib/server/environment';

const DEFAULT_GROQ_CHAT_MODEL_ID = 'llama-3.1-8b-instant';
const DEFAULT_GROQ_STRUCTURED_MODEL_ID = 'openai/gpt-oss-120b';

export function getGroqAiConfig() {
  return {
    apiKey: getRequiredEnvironmentVariable('GROQ_API_KEY'),
    baseURL: 'https://api.groq.com/openai/v1',
    chatModelId: process.env.GROQ_CHAT_MODEL_ID ?? DEFAULT_GROQ_CHAT_MODEL_ID,
    structuredModelId: process.env.GROQ_STRUCTURED_MODEL_ID ?? DEFAULT_GROQ_STRUCTURED_MODEL_ID,
  };
}
