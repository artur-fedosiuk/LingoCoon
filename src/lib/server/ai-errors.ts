import { InvalidAiRequestError } from '@/lib/server/ai-validation';
import { AuthenticationRequiredError } from '@/lib/supabase/auth';

export function getFriendlyAiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (error instanceof AuthenticationRequiredError || error instanceof InvalidAiRequestError) {
    return message;
  }

  if (message.includes('OPENAI_API_KEY')) {
    return 'AI service is not configured. Add a valid OpenAI API key and restart the app.';
  }

  if (message.includes('403') || message.toLowerCase().includes('authorization')) {
    return 'AI service authorization failed. Generate a new OpenAI API key and restart the app.';
  }

  return 'AI service is temporarily unavailable. Please try again.';
}
