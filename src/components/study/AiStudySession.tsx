// File: src/components/study/AiStudySession.tsx
// Created: 2024-01-01
// Last-Updated: 2025-06-01
// Author: Claude
// Description: AI-driven study session. The AI conducts a quiz — it shows the front
//              of each card and waits for the student to type the translation.
//              The AI evaluates answers conversationally and advances through the deck.

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { askAIWithHistory } from '@/lib/actions/ai-actions';
import { rateCard } from '@/lib/actions/deck-actions';
import { Rating } from 'ts-fsrs';
import TypingDots from '@/components/ui/TypingDots';
import type { ConversationTurn } from '@/lib/actions/ai-actions';
import type { SessionCard } from '@/types/study';
import type { Deck } from '@/lib/supabase/types';
import type { ChatMessage } from '@/types/chat';

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface AiStudySessionProps {
  /** All cards in the deck (pre-loaded by the server). */
  cards: SessionCard[];
  /** The deck metadata (title, language codes). */
  deck: Deck;
  /** Student's native language — the AI always responds in this language. */
  nativeLanguage: string;
}

// ─── SYSTEM PROMPT BUILDER ────────────────────────────────────────────────────

/**
 * buildSystemPrompt — creates the AI's "instruction manual" for this quiz session.
 *
 * This tells the AI:
 * - What deck and cards to quiz the student on.
 * - How to conduct the quiz (one card at a time, wait for answer, give feedback).
 * - Which language to respond in.
 *
 * The system prompt is sent with EVERY API call so the AI always has context.
 */
function buildSystemPrompt(cards: SessionCard[], deck: Deck, nativeLanguage: string): string {
  // Format the card list as a numbered text list so the AI can read it.
  const cardList = cards
    .map(
      (c, i) =>
        `${i + 1}. Front: "${c.front}" | Back: "${c.back}"${
          c.exampleSentence ? ` | Example: "${c.exampleSentence}"` : ''
        }`
    )
    .join('\n');

  return `You are an AI language tutor conducting an interactive flashcard quiz.

Deck: "${deck.title}"
Language direction: ${deck.language_from} → ${deck.language_to}

Cards to study (${cards.length} total):
${cardList}

## Your role:
- Quiz the student on ONE card at a time, starting with card 1.
- Show the FRONT of the card and ask the student to provide the meaning/translation (the BACK).
- After the student answers, evaluate whether it was correct or close enough.
- Give brief encouraging feedback (1–2 sentences maximum).
- If wrong, briefly show the correct answer, then move AUTOMATICALLY to the next card.
- Track progress (e.g. "Card 2 of ${cards.length}").
- When all cards are done, congratulate the student warmly.

## Rules:
- NEVER reveal the answer before the student tries.
- Be encouraging and supportive, never harsh.
- Accept synonyms and paraphrases as correct.
- ALWAYS respond in ${nativeLanguage}, no matter what language the student writes in.
- Keep messages brief and focused — this is a quiz, not a lecture.
- Clear format for questions: state the card number and the word/phrase to translate.

## Start:
Begin immediately by presenting the first card.`;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function AiStudySession({ cards: initialCards, deck, nativeLanguage }: AiStudySessionProps) {
  const { t } = useTranslation();

  // ── State ────────────────────────────────────────────────────────────────

  // The chat bubbles displayed on screen (user messages and AI replies).
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // The text currently typed by the student.
  const [input, setInput] = useState('');

  // True while waiting for the AI to respond.
  const [loading, setLoading] = useState(false);

  // True when the AI has confirmed the student finished all cards.
  const [sessionComplete, setSessionComplete] = useState(false);

  // Tracks which card number (0-based index) the student is currently on.
  // Used to calculate the progress bar and detect when the quiz ends.
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // The full conversation history in the API's format (alternating user/model turns).
  // We send this entire array with every API call so the AI remembers context.
  const [history, setHistory] = useState<ConversationTurn[]>([]);

  // Tracks which card IDs have already been rated so we never rate the same card twice.
  const [ratedCardIds, setRatedCardIds] = useState<Set<string>>(new Set());

  // ── Refs ──────────────────────────────────────────────────────────────────

  // A ref to the bottom of the messages list — used to auto-scroll down.
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // A ref to the text input — used to automatically focus it after each reply.
  const inputRef = useRef<HTMLInputElement>(null);

  // The system prompt is computed once at mount and stored in a ref.
  // We use a ref (not state) because we never need to re-render when it changes.
  const systemPromptRef = useRef(buildSystemPrompt(initialCards, deck, nativeLanguage));

  // A ref to track whether the startup sequence has run (prevents it running twice).
  const hasStartedRef = useRef(false);

  // ── Helpers ──────────────────────────────────────────────────────────────

  // Scrolls the chat view to the bottom so the latest message is always visible.
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ── Startup ───────────────────────────────────────────────────────────────

  /**
   * On mount, send a hidden "start" message to the AI to get the first card question.
   * We use a ref guard so this only ever runs once, even in React Strict Mode
   * (which intentionally mounts components twice in development).
   */
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const startSession = async () => {
      setLoading(true);
      try {
        // Send a hidden trigger message so the AI opens the quiz.
        const startTurn: ConversationTurn = {
          role: 'user',
          parts: [{ text: 'Start the session.' }],
        };
        const initialHistory = [startTurn];

        const response = await askAIWithHistory(systemPromptRef.current, initialHistory);

        const aiTurn: ConversationTurn = {
          role: 'model',
          parts: [{ text: response }],
        };

        // Save the full history so future messages have context.
        setHistory([...initialHistory, aiTurn]);

        // Show only the AI's opening message (not the hidden trigger).
        setMessages([{ role: 'ai', text: response }]);
      } catch {
        setMessages([{ role: 'ai', text: t('study.ai_mode.start_error') }]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    };

    startSession();
  }, []); // Empty array = run only once on mount.

  // ── Session Complete Detection ─────────────────────────────────────────────

  /**
   * Checks whether the AI's response indicates the quiz is finished.
   *
   * This is a heuristic (educated guess) — we look for common completion phrases
   * AND check that we're on the last card to avoid false positives.
   */
  const isSessionDone = useCallback((aiText: string): boolean => {
    const lower = aiText.toLowerCase();
    const completionPhrases = [
      'all cards', 'session complete', 'well done', 'congratulation',
      'finished', 'great job', 'session is over', "you've completed",
      'you have completed', 'ottimo lavoro', 'hai completato', 'bravo',
      'toutes les cartes', 'session terminée', 'félicitations',
      'всі картки', 'сесію завершено', 'молодець',
    ];
    return (
      currentCardIndex >= initialCards.length - 1 &&
      completionPhrases.some((phrase) => lower.includes(phrase))
    );
  }, [currentCardIndex, initialCards.length]);

  // ── Send Handler ──────────────────────────────────────────────────────────

  /**
   * handleSend — called when the student presses Send or hits Enter.
   *
   * Steps:
   * 1. Add the student's message to the UI immediately.
   * 2. Append it to the history and send the full history to the AI.
   * 3. Receive the AI's reply and add it to the UI.
   * 4. Detect if the AI moved to the next card → advance our index + rate the card.
   * 5. Detect if the quiz ended → show the completion screen.
   */
  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Immediately show the student's message.
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    // Build the new history with the student's message appended.
    const userTurn: ConversationTurn = { role: 'user', parts: [{ text }] };
    const newHistory = [...history, userTurn];

    try {
      const response = await askAIWithHistory(systemPromptRef.current, newHistory);
      const aiTurn: ConversationTurn = { role: 'model', parts: [{ text: response }] };

      // Save updated history for the next round.
      setHistory([...newHistory, aiTurn]);

      // Show the AI's reply.
      setMessages((prev) => [...prev, { role: 'ai', text: response }]);

      // ── Card Advance Heuristic ────────────────────────────────────────
      // Check if the AI mentioned moving to the next card number.
      const lowerResp = response.toLowerCase();
      const nextCardPhrases = ['card 2', 'card 3', 'card 4', 'card 5', 'card 6',
        'carta 2', 'carta 3', 'carte 2', 'carte 3', '#2', '#3', '#4',
        'next card', 'prossima', 'suivante', 'наступна'];
      const isMovingToNextCard =
        nextCardPhrases.some((p) => lowerResp.includes(p)) ||
        (lowerResp.includes('card') && lowerResp.includes(' of ')) ||
        (lowerResp.includes('carte') && lowerResp.includes(' sur '));

      if (isMovingToNextCard && currentCardIndex < initialCards.length - 1) {
        const cardToRate = initialCards[currentCardIndex];
        // Only rate this card once, even if this block runs again.
        if (!ratedCardIds.has(cardToRate.id)) {
          setRatedCardIds((prev) => new Set(prev).add(cardToRate.id));
          // Rate as "Good" — the AI session doesn't have explicit rating buttons.
          rateCard(cardToRate.id, Rating.Good).catch(() => {/* silent fail */});
          setCurrentCardIndex((prev) => prev + 1);
        }
      }

      // ── Session End Detection ─────────────────────────────────────────
      if (isSessionDone(response)) {
        const lastCard = initialCards[initialCards.length - 1];
        if (!ratedCardIds.has(lastCard.id)) {
          rateCard(lastCard.id, Rating.Good).catch(() => {/* silent fail */});
        }
        // Wait 2 seconds before showing the completion screen so the student
        // can read the AI's congratulations message.
        setTimeout(() => setSessionComplete(true), 2000);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: t('study.ai_mode.ai_error') }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // ── Enter Key ─────────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Progress ─────────────────────────────────────────────────────────────

  const progressPercent = Math.min(
    100,
    Math.round((currentCardIndex / initialCards.length) * 100)
  );

  // ── Session Complete Screen ───────────────────────────────────────────────

  if (sessionComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center space-y-6 px-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('study.ai_mode.session_complete_title')}
          </h1>
          <p className="text-gray-500 text-sm">
            {t('study.ai_mode.session_complete_subtitle', { count: initialCards.length })}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {/* Option to retry the same deck in classic mode. */}
            <a
              href={`/study/${deck.id}`}
              className="inline-block bg-gray-900 text-white font-semibold px-6 py-2.5
                         rounded-xl hover:bg-gray-800 transition-colors text-sm"
            >
              {t('study.ai_mode.retry_classic')}
            </a>
            {/* Back to the deck management page. */}
            <a
              href={`/decks/${deck.id}`}
              className="inline-block border border-gray-300 text-gray-600 font-semibold
                         px-6 py-2.5 rounded-xl hover:border-gray-400 hover:text-gray-900
                         transition-colors text-sm"
            >
              {t('study.ai_mode.back_to_deck')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Chat View ────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-white flex-col overflow-hidden">

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
        {/* Back link to the deck page */}
        <a
          href={`/decks/${deck.id}`}
          className="text-gray-500 hover:text-gray-900 text-sm transition-colors flex items-center gap-1.5"
        >
          <span>←</span>
          <span>{deck.title}</span>
        </a>

        {/* AI Mode badge */}
        <div className="flex items-center gap-2">
          {/* Pulsing dot indicates "live" AI session */}
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-900">
            {t('study.ai_mode.badge')}
          </span>
        </div>

        {/* Card progress counter */}
        <span className="text-gray-400 text-sm">
          {t('study.progress', {
            current: Math.min(currentCardIndex + 1, initialCards.length),
            total: initialCards.length,
          })}
        </span>
      </div>

      {/* PROGRESS BAR */}
      <div className="h-0.5 bg-gray-100 flex-shrink-0">
        <div
          className="h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* CHAT MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">

        {/* Loading skeleton shown before the AI sends its first message */}
        {messages.length === 0 && loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[80%]">
              <TypingDots />
            </div>
          </div>
        )}

        {/* Render every chat message */}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* AI avatar dot */}
            {msg.role === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600
                              flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                <span className="text-xs text-white">✦</span>
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-gray-900 text-white rounded-2xl rounded-tr-sm'
                  : 'bg-gray-100 border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator shown while AI is generating a reply */}
        {loading && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600
                            flex items-center justify-center mr-2 flex-shrink-0">
              <span className="text-xs text-white">✦</span>
            </div>
            <div className="bg-gray-100 border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm">
              <TypingDots />
            </div>
          </div>
        )}

        {/* Invisible element at the bottom — scrolled into view after each new message */}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="px-4 py-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex gap-3 items-center max-w-3xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            // Show a different placeholder while the AI is thinking.
            placeholder={loading ? t('study.ai_mode.input_thinking') : t('study.ai_mode.input_placeholder')}
            disabled={loading}
            className="flex-1 bg-white border border-gray-300 text-gray-900 text-sm rounded-xl
                       px-4 py-3 placeholder-gray-400 focus:outline-none focus:border-violet-400
                       focus:ring-1 focus:ring-violet-300 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm
                       font-semibold px-5 py-3 rounded-xl disabled:opacity-40
                       hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-95"
          >
            {t('study.ai_mode.send')}
          </button>
        </div>
        {/* Hint below the input */}
        <p className="text-center text-xs text-gray-400 mt-2">
          {t('study.ai_mode.press_enter')}
        </p>
      </div>

    </div>
  );
}
