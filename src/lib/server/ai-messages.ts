import type OpenAI from 'openai';
import type { ConversationTurn } from '@/types/ai';

export function buildOpenAiMessages(
  systemPrompt: string,
  history: ConversationTurn[],
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return [
    { role: 'system', content: systemPrompt },
    ...history.map((turn) => ({
      role: turn.role === 'model' ? 'assistant' : 'user',
      content: turn.parts.map((part) => part.text).join('\n'),
    }) as OpenAI.Chat.Completions.ChatCompletionMessageParam),
  ];
}
