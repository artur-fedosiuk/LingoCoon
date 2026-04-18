// File: src/components/study/AiPanel.tsx
// Created: 2024-01-01
// Last-Updated: 2025-06-01
// Author: Claude
// Description: Sidebar chat panel that appears next to the classic flashcard study session.
//              The student can ask the AI tutor questions about the current card.

'use client';

import { useTranslation } from 'react-i18next';
import type { SessionCard } from '@/types/study';
import type { ChatMessage } from '@/types/chat';

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface AiPanelProps {
  /** The flashcard currently being studied (for context, not displayed here). */
  currentCard: SessionCard;
  /** All messages in the current card's chat history. */
  messages: ChatMessage[];
  /** Current value of the text input field. */
  input: string;
  /** True while waiting for the AI to respond. */
  loading: boolean;
  /** The student's native language — displayed in the header subtitle. */
  nativeLanguage: string;
  /** Called whenever the user types in the input field. */
  onInputChange: (value: string) => void;
  /** Called when the user clicks Send or presses Enter. */
  onSend: () => void;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function AiPanel({
  messages,
  input,
  loading,
  nativeLanguage,
  onInputChange,
  onSend,
}: AiPanelProps) {
  // t() is the translation function. t('study.send') looks up the "send" key
  // inside the "study" section of the active language's translation.json file.
  const { t } = useTranslation();

  // Allow sending by pressing Enter (without Shift, which would normally add a newline).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Prevent the default browser behavior (form submission / newline).
      e.preventDefault();
      onSend();
    }
  };

  return (
    // Outer container: dark sidebar with a left border separating it from the card area.
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-700">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-zinc-700">
        {/* Panel title */}
        <p className="text-sm font-semibold text-white">
          {t('study.ai_tutor_label')}
        </p>
        {/* Subtitle: tells the student what language the AI will respond in. */}
        <p className="text-xs text-zinc-500">
          {t('study.responds_in', { language: nativeLanguage })}
        </p>
      </div>

      {/* ── MESSAGES ────────────────────────────────────────────────────── */}
      {/* flex-1 makes this section grow to fill the remaining height. */}
      {/* overflow-y-auto adds a scrollbar when messages overflow the panel. */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* Empty state: shown when no messages have been sent yet. */}
        {messages.length === 0 && (
          <p className="text-xs text-zinc-500 text-center mt-4">
            {t('study.ask_about_card')}
          </p>
        )}

        {/* Render each message as a chat bubble. */}
        {messages.map((msg, index) => (
          <div
            key={index}
            // User messages align to the right; AI messages to the left.
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-white text-zinc-900'         // User bubble: white background
                  : 'bg-zinc-800 text-zinc-100 border border-zinc-700' // AI bubble: dark
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Loading indicator: shown while the AI is generating a response. */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-xl text-sm text-zinc-400">
              {t('study.thinking')}
            </div>
          </div>
        )}
      </div>

      {/* ── INPUT BAR ───────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-zinc-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('study.ask_placeholder')}
          disabled={loading}
          className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg
                     px-3 py-2 placeholder-zinc-500 focus:outline-none focus:border-zinc-500
                     disabled:opacity-50"
        />
        <button
          onClick={onSend}
          // Disable the button while loading OR when the input is empty.
          disabled={loading || !input.trim()}
          className="bg-white text-zinc-900 text-sm font-semibold px-4 py-2 rounded-lg
                     disabled:opacity-40 hover:bg-zinc-100 transition-colors"
        >
          {t('study.send')}
        </button>
      </div>

    </div>
  );
}
