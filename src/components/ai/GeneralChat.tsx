// File: src/components/ai/GeneralChat.tsx
// Created: 2024-01-01
// Last-Updated: 2025-06-01
// Author: Claude
// Description: Free-form chat interface with the AI assistant ("Lingo").
//              No deck required — the student can ask any language question.

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Sparkles } from 'lucide-react';
import { askAIWithHistory } from '@/lib/actions/ai-actions';
import TypingDots from '@/components/ui/TypingDots';
import type { ConversationTurn } from '@/lib/actions/ai-actions';
import type { ChatMessage } from '@/types/chat';

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

/**
 * GENERAL_SYSTEM_PROMPT — tells the AI who "Lingo" is and what it can do.
 *
 * This is sent with every API call so the AI always stays "in character".
 * It is a constant (never changes at runtime), so we define it outside the
 * component to avoid recreating it on every render.
 */
const GENERAL_SYSTEM_PROMPT = `You are Lingo, a friendly and intelligent language learning assistant built into LinguaCoon.
You help users with:
- Translating words and sentences
- Explaining grammar rules
- Giving usage examples
- Answering language-related questions
- Chatting in any language the user wants to practice
- Helping with pronunciation tips and cultural context

Be concise, warm, and encouraging. If the user writes in a foreign language they're learning,
gently correct mistakes if needed. Always respond in the same language the user writes in,
unless asked otherwise.`;

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function GeneralChat() {
  const { t } = useTranslation();

  // ── State ────────────────────────────────────────────────────────────────

  /**
   * messages: the chat bubbles shown on screen.
   * We pre-populate it with Lingo's welcome message so the chat doesn't start
   * looking empty. The welcome text comes from the translation file (chat.welcome).
   */
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: t('chat.welcome') },
  ]);

  /**
   * history: the conversation in the API's required format (alternating user/model turns).
   * We must send this ENTIRE array with every API call so the AI remembers context.
   * We initialise it with the AI's welcome message so the AI knows what it already "said".
   */
  const [history, setHistory] = useState<ConversationTurn[]>([
    { role: 'model', parts: [{ text: t('chat.welcome') }] },
  ]);

  // Current text in the input field.
  const [input, setInput] = useState('');

  // True while waiting for the AI to respond (prevents double-sending).
  const [loading, setLoading] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────

  // Auto-scroll: a reference to the invisible div at the bottom of the message list.
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-focus: keeps the cursor in the input field after each AI reply.
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Scroll down every time a new message appears.
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ── Send Handler ──────────────────────────────────────────────────────────

  /**
   * handleSend — sends the student's message to the AI and shows the reply.
   *
   * Steps:
   * 1. Add user message to the UI immediately (optimistic update).
   * 2. Append it to the history array.
   * 3. Call askAIWithHistory (a Server Action — API key stays on server).
   * 4. Append the AI reply to both the UI messages and the history.
   */
  const handleSend = async () => {
    const text = input.trim();

    // Do nothing if the input is blank or a request is already running.
    if (!text || loading) return;

    // Show the user's message immediately so the UI feels responsive.
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    // Build the new history with the user's message added to the end.
    const userTurn: ConversationTurn = { role: 'user', parts: [{ text }] };
    const newHistory = [...history, userTurn];

    try {
      // askAIWithHistory is a Server Action — it runs on the server.
      // The browser never sees the API key.
      const response = await askAIWithHistory(GENERAL_SYSTEM_PROMPT, newHistory);

      const aiTurn: ConversationTurn = { role: 'model', parts: [{ text: response }] };

      // Save the updated history for future turns.
      setHistory([...newHistory, aiTurn]);

      // Show the AI's reply in the chat.
      setMessages((prev) => [...prev, { role: 'ai', text: response }]);
    } catch {
      // If the API call fails, show a friendly error message.
      setMessages((prev) => [...prev, { role: 'ai', text: t('chat.error') }]);
    } finally {
      setLoading(false);
      // Return focus to the input field so the student can type the next message.
      inputRef.current?.focus();
    }
  };

  // Allow sending by pressing Enter (Shift+Enter does nothing special here).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    // Full-height flex column: messages fill the space, input sticks to the bottom.
    <div className="flex flex-col h-full">

      {/* ── MESSAGES AREA ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

        {/* Render each chat bubble. */}
        {messages.map((msg, index) => (
          <div
            key={index}
            // User messages are right-aligned; AI messages are left-aligned.
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* AI avatar: a small gradient circle with a sparkle icon. */}
            {msg.role === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600
                              flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            {/* Message bubble. */}
            <div
              className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-gray-900 text-white rounded-2xl rounded-tr-sm'       // User: dark bubble
                  : 'bg-gray-100 border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm' // AI: light bubble
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator: shown while the AI is generating a reply. */}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600
                            flex items-center justify-center mr-2 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-gray-100 border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm">
              <TypingDots />
            </div>
          </div>
        )}

        {/* Scroll anchor: scrolled into view after every new message. */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT AREA ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-gray-100 px-4 py-4">
        <div className="flex gap-3 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            // Placeholder changes while loading to inform the student.
            placeholder={loading ? t('chat.thinking') : t('chat.placeholder')}
            disabled={loading}
            className="flex-1 bg-white border border-gray-200 text-gray-900 text-sm rounded-xl
                       px-4 py-3 placeholder-gray-400 focus:outline-none focus:border-violet-400
                       focus:ring-1 focus:ring-violet-200 disabled:opacity-50 transition-colors"
          />
          {/* Send button — disabled when loading or input is empty. */}
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm
                       font-semibold px-4 py-3 rounded-xl disabled:opacity-40
                       hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-95
                       flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {/* Hint text below the input. */}
        <p className="text-center text-xs text-gray-400 mt-2">{t('chat.press_enter')}</p>
      </div>

    </div>
  );
}
