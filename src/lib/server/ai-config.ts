import { getRequiredEnvironmentVariable } from '@/lib/server/environment';

const DEFAULT_OPENAI_CHAT_MODEL_ID = 'gpt-5.4-mini';
const DEFAULT_OPENAI_STRUCTURED_MODEL_ID = 'gpt-5.4-mini';

export function getAiConfig() {
  return {
    apiKey: getRequiredEnvironmentVariable('OPENAI_API_KEY'),
    baseURL: 'https://api.openai.com/v1',
    chatModelId: process.env.OPENAI_CHAT_MODEL_ID ?? DEFAULT_OPENAI_CHAT_MODEL_ID,
    provider: 'OpenAI',
    structuredModelId:
      process.env.OPENAI_STRUCTURED_MODEL_ID ?? DEFAULT_OPENAI_STRUCTURED_MODEL_ID,
  };
}
