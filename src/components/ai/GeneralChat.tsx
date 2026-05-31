// Description: Free-form chat interface with the AI assistant ("Lingo").
//              No deck required — the student can ask any language question.

'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Sparkles, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { askAIWithHistory } from '@/lib/actions/ai-actions';
import { parseDisplayText, isoToBcp47, getRecommendedVoice, PREFERRED_GENDER, parseSegments } from '@/lib/tts-utils';
import type { TTSSegment } from '@/lib/tts-utils';
import TypingDots from '@/components/ui/TypingDots';
import type { ConversationTurn } from '@/lib/actions/ai-actions';
import type { ChatMessage } from '@/types/chat';

/// ─── SYSTEM PROMPT BUILDER ────────────────────────────────────────────────────────────────

/**
 * buildGeneralSystemPrompt — builds a language-agnostic immersive tutor prompt.
 *
 * Design principle:
 *   No language has priority. The native language acts as a scaffolding tool
 *   (used for explanations when needed), while the target language is the
 *   medium of the conversation. This applies equally to any language pair:
 *   uk→fr, it→en, fr→uk, de→es — the structure is identical.
 *
 * The <tl> tagging instruction is mandatory for the TTS engine to
 * pronounce target-language segments with the correct phoneme rules.
 */
/**
 * ISO 639-1 → full English language names.
 * Used in the system prompt so the LLM understands which languages to use.
 * ISO codes like 'it' and 'fr' confuse the model: 'Use it only as a scaffolding
 * tool' reads as the English pronoun 'it', not 'Italian'.
 */
const LANG_NAMES: Record<string, string> = {
  en: 'English', it: 'Italian', fr: 'French', uk: 'Ukrainian',
  de: 'German',  es: 'Spanish', pt: 'Portuguese', pl: 'Polish',
  ru: 'Russian', ja: 'Japanese', zh: 'Chinese', ar: 'Arabic', ko: 'Korean',
};

function toLangName(code: string): string {
  return LANG_NAMES[code.toLowerCase()] ?? code;
}

function buildGeneralSystemPrompt(
  nativeLanguage: string,
  targetLanguage: string | null,
): string {
  const nativeName = toLangName(nativeLanguage);

  if (!targetLanguage) {
    return `You are Lingo, a language tutor for the LingoCoon app.
The student's native language is ${nativeName}. No target language is set in their profile.
Ask them which language they want to practice today. Keep it brief.`;
  }

  const targetName = toLangName(targetLanguage);

  return `You are Lingo, an immersive language tutor for the LingoCoon app.

Student configuration:
- Native language: ${nativeName}
- Target language (being studied): ${targetName}

COMMUNICATION RULES:
1. Conduct the conversation primarily in ${targetName}. This is the working language.
2. Use ${nativeName} only as a scaffolding tool: to clarify meaning, explain a grammar point, or recover from confusion.
3. Keep every reply short: 2–3 sentences maximum.
4. If the student writes in ${nativeName}, gently nudge them to try in ${targetName}.
5. When correcting a mistake:
   Wrong: [student's incorrect phrase] → Correct: <tl>[corrected form]</tl>
   One-line explanation in ${nativeName}.

AUDIO TAGGING — MANDATORY:
Every word or phrase in ${targetName} MUST be wrapped in <tl> tags.
The TTS engine uses these tags to switch phoneme rules per segment.
Tag every ${targetName} segment without exception — single words, full sentences, corrections.
When your ENTIRE reply is in ${targetName}, wrap the whole message in one <tl> block:
  Example: <tl>Bonjour! Comment ça va aujourd'hui?</tl>
Do NOT tag ${nativeName} content.`;
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

/** Flag emoji per ISO 639-1 code — used in the TTS transcript panel. */
const LANG_FLAGS: Record<string, string> = {
  it: '🇮🇹', fr: '🇫🇷', en: '🇬🇧', uk: '🇺🇦',
  de: '🇩🇪', es: '🇪🇸', pt: '🇵🇹', pl: '🇵🇱',
  ru: '🇷🇺', ja: '🇯🇵', zh: '🇨🇳', ko: '🇰🇷', ar: '🇸🇦',
};

// ─── COMPONENT ─────────────────────────────────────────────────────────────────

interface GeneralChatProps {
  /** The user's native language from their Supabase profile (e.g. 'italiano', 'en'). */
  nativeLanguage: string | null;
  /** The language the user is studying (e.g. 'francese', 'fr'). Null if not set. */
  targetLanguage: string | null;
}

export default function GeneralChat({ nativeLanguage, targetLanguage }: GeneralChatProps) {
  const { t } = useTranslation();

  // ── State ────────────────────────────────────────────────────────────────

  // Build the system prompt once and memoize it.
  // useMemo recalculates only if nativeLanguage or targetLanguage change — which
  // in practice means once per mount since the page server-renders these values.
  // Fallback: if the profile has no language set, use 'English' as a safe default.
  const systemPrompt = useMemo(
    () => buildGeneralSystemPrompt(
      nativeLanguage ?? 'English',
      targetLanguage,
    ),
    [nativeLanguage, targetLanguage],
  );

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

  // Index of the AI message currently loading audio (-1 = none).
  const [audioLoadingIdx, setAudioLoadingIdx] = useState<number>(-1);

  /**
   * autoPlay — when true, every new AI message plays audio automatically.
   * The user toggles this with the speaker button in the header.
   * Default OFF to respect the user's environment (public place, etc.).
   */
  const [autoPlay, setAutoPlay] = useState(false);

  /**
   * transcripts — stores parsed TTS segments per message index.
   * Populated the first time a message's audio is played.
   * Used to render the transcript panel under each AI message.
   */
  const [transcripts, setTranscripts] = useState<Record<number, TTSSegment[]>>({});

  /**
   * openTranscriptIdx — which message's transcript panel is currently expanded.
   * null = all closed. Only one can be open at a time.
   */
  const [openTranscriptIdx, setOpenTranscriptIdx] = useState<number | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────

  // Auto-scroll: a reference to the invisible div at the bottom of the message list.
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-focus: keeps the cursor in the input field after each AI reply.
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * segmentCache — per-segment audio cache.
   * Key: "lang:text" (e.g. "fr:bonjour") → base64 MP3 audio content.
   *
   * Why keyed by lang+text instead of message index?
   * The same French word can appear in multiple messages. With segment-level
   * caching, "bonjour" fetched once is reused for every future message containing it.
   * Message-level caching would re-fetch the same word every time it appeared.
   */
  const segmentCache = useRef<Record<string, string>>({});

  /**
   * prevLoadingRef — tracks the previous value of `loading`.
   *
   * Why a ref and not state?
   * We need to detect the TRANSITION loading:true → false (= AI just finished).
   * Storing prev in state would cause an extra render. A ref is instant and zero-cost.
   *
   * React 18 batches setMessages + setLoading(false) in async functions,
   * so when the effect fires, BOTH the new message AND loading:false are committed.
   * prevLoadingRef still holds the old value (true) until we update it at the end.
   */
  const prevLoadingRef = useRef(false);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Scroll down every time a new message appears.
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ── Send Handler ──────────────────────────────────────────────────────────

  // ── Audio Handler ────────────────────────────────────────────────────────

  /**
   * handlePlayAudio — segment-based multilingual TTS.
   *
   * Previous approach (SSML <lang> tags): sent one request with language-switching
   * markup. FAILED because Neural2 voices are single-language models and ignore
   * <lang> tags when the language differs from the voice's native language.
   *
   * Current approach:
   *   1. parseSegments() splits the text on <tl> boundaries into language-tagged segments.
   *   2. All segments are fetched in PARALLEL (Promise.all) using the correct native voice.
   *   3. Segment audio is cached by "lang:text" — a French word heard once is cached
   *      for every future message that contains it.
   *   4. All MP3 buffers are decoded with a single shared AudioContext.
   *   5. Buffers are pre-scheduled for GAPLESS sequential playback.
   *      This avoids the click/gap that HTML Audio elements produce between files.
   *
   * The spinner (audioLoadingIdx) is released as soon as all network calls finish
   * and playback is scheduled — not when playback completes. This is the correct UX:
   * the user can see the spinner while waiting for audio, then hear it immediately.
   */
  const handlePlayAudio = useCallback(async (rawText: string, msgIndex: number) => {
    if (audioLoadingIdx !== -1) return;
    setAudioLoadingIdx(msgIndex);

    try {
      const nativeLang = nativeLanguage ?? 'en';
      const targetLang = targetLanguage ?? null;

      // Step 1: Parse AI response into language-tagged segments.
      // e.g. "La parola <tl>bonjour</tl> significa ciao"
      // → [{text:'La parola', lang:'it'}, {text:'bonjour', lang:'fr'}, {text:'significa ciao', lang:'it'}]
      const segments = parseSegments(rawText, nativeLang, targetLang);
      if (segments.length === 0) return;

      // Save segments for the transcript panel — before any async work,
      // so the panel is available even if audio fetch fails.
      setTranscripts(prev => ({ ...prev, [msgIndex]: segments }));

      // Step 2: Fetch all segment audio in parallel.
      // Per-segment cache: if "fr:bonjour" was already fetched in a previous message,
      // this call returns the cached base64 instantly without a network request.
      const base64List = await Promise.all(
        segments.map(async (seg) => {
          const cacheKey = `${seg.lang}:${seg.text}`;
          if (segmentCache.current[cacheKey]) return segmentCache.current[cacheKey];

          const bcp47     = isoToBcp47(seg.lang);
          const voiceName = getRecommendedVoice(bcp47);

          const res = await fetch('/api/tts/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: seg.text,
              languageCode: bcp47,
              ...(voiceName ? { voiceName } : { ssmlGender: PREFERRED_GENDER }),
              speakingRate: 0.95,
            }),
          });

          if (!res.ok) throw new Error(`TTS segment failed [${seg.lang}]: ${res.status}`);
          const { audioContent } = await res.json() as { audioContent: string };
          segmentCache.current[cacheKey] = audioContent;
          return audioContent;
        }),
      );

      // Step 3: Decode all MP3 buffers using a single shared AudioContext.
      // Why a shared context? AudioBuffers cannot be transferred between contexts.
      // Why AudioContext over HTML Audio?
      // HTML Audio has a ~200ms gap between sequential files (event loop overhead).
      // AudioContext.start(when) schedules playback at sample-level precision = gapless.
      const ctx = new AudioContext();
      // Some browsers (Safari, Chrome after inactivity) suspend AudioContext until a
      // user gesture is detected. Resume explicitly to ensure audio plays.
      if (ctx.state === 'suspended') await ctx.resume();

      const audioBuffers = await Promise.all(
        base64List.map((b64) => {
          // base64 → ArrayBuffer → AudioBuffer.
          // atob() decodes base64 to a binary string; Uint8Array converts to bytes.
          const binary = atob(b64);
          const bytes   = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          // decodeAudioData() detaches the ArrayBuffer it receives.
          // Since each b64 creates its own Uint8Array/ArrayBuffer, no sharing issue.
          return ctx.decodeAudioData(bytes.buffer);
        }),
      );

      // Step 4: Pre-schedule all buffers for gapless sequential playback.
      // ctx.currentTime is the audio clock in seconds.
      // Each buffer starts exactly when the previous one ends (duration is precise).
      let startAt = ctx.currentTime + 0.05; // 50ms startup buffer for decoding latency.
      for (const buffer of audioBuffers) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(startAt);
        startAt += buffer.duration;
      }

    } catch (err) {
      // Silent fail — TTS is an enhancement, not a critical feature.
      console.error('[TTS] error:', err);
    } finally {
      setAudioLoadingIdx(-1);
    }
  }, [audioLoadingIdx, nativeLanguage, targetLanguage]);

  /**
   * Auto-play effect — placed after handlePlayAudio to avoid TDZ.
   *
   * `const` declarations are not hoisted: referencing handlePlayAudio in a
   * useEffect dependency array BEFORE its declaration causes a ReferenceError
   * at runtime (Temporal Dead Zone). Moving this effect here fixes it.
   *
   * Detection logic: prevLoadingRef tracks the previous value of `loading`.
   * The transition true→false fires exactly once per AI response — not at
   * mount, not on unrelated renders.
   */
  useEffect(() => {
    const justFinished = prevLoadingRef.current && !loading;
    prevLoadingRef.current = loading;

    if (!justFinished || !autoPlay) return;

    const lastIdx = messages.length - 1;
    const lastMsg = messages[lastIdx];
    if (lastMsg?.role === 'ai') {
      handlePlayAudio(lastMsg.text, lastIdx);
    }
  }, [loading, autoPlay, messages, handlePlayAudio]);

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

    // Guard against oversized payloads — protects the API from abuse.
    // 500 chars is generous for language learning but prevents pathological inputs.
    const MAX_INPUT_LENGTH = 500;
    if (text.length > MAX_INPUT_LENGTH) {
      setMessages((prev) => [...prev, {
        role: 'ai',
        text: `Message too long (max ${MAX_INPUT_LENGTH} characters). Please shorten your answer.`,
      }]);
      return;
    }

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
      // We now use the memoized systemPrompt instead of the old hardcoded constant.
      const response = await askAIWithHistory(systemPrompt, newHistory);

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
    <div className="flex flex-col h-full">

      {/* ── HEADER BAR: auto-play toggle ─────────────────────────────── */}
      <div className="flex-shrink-0 flex justify-end px-4 pt-3 pb-1">
        {/*
          Auto-play toggle.
          Volume2  = audio ON  (violet, filled)
          VolumeX  = audio OFF (gray, muted)
          Tooltip via title attribute — no extra library needed.
        */}
        <button
          onClick={() => setAutoPlay(prev => !prev)}
          title={autoPlay ? 'Auto-play ON — click to disable' : 'Auto-play OFF — click to enable'}
          aria-label={autoPlay ? 'Disable auto-play' : 'Enable auto-play'}
          className={`p-2 rounded-full transition-colors ${
            autoPlay
              ? 'text-violet-600 bg-violet-50 hover:bg-violet-100'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
        >
          {autoPlay
            ? <Volume2 className="w-4 h-4" />
            : <VolumeX className="w-4 h-4" />
          }
        </button>
      </div>

      {/* ── MESSAGES AREA ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

        {/* Render each chat bubble. */}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* AI avatar */}
            {msg.role === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600
                              flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            <div className="flex flex-col gap-1 max-w-[75%]">
              {/* Message bubble */}
              <div
                className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white rounded-2xl rounded-tr-sm'
                    : 'bg-gray-100 border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm'
                }`}
              >
                {/*
                  parseDisplayText strips <tl>...</tl> markers from AI responses.
                  These tags are used only by the TTS engine and must never be shown.
                  Example: "La parola <tl>bonjour</tl>" → "La parola bonjour"
                */}
                {msg.role === 'ai' ? parseDisplayText(msg.text) : msg.text}
              </div>

              {/* Audio button + transcript toggle — only for AI messages */}
              {msg.role === 'ai' && (
                <div className="flex items-center gap-1 ml-1">

                  {/* Play button */}
                  <button
                    onClick={() => handlePlayAudio(msg.text, index)}
                    disabled={audioLoadingIdx !== -1}
                    aria-label="Play audio"
                    className="p-1.5 rounded-full text-gray-400
                               hover:text-violet-500 hover:bg-violet-50
                               disabled:opacity-30 transition-colors"
                  >
                    {audioLoadingIdx === index
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Volume2 className="w-3.5 h-3.5" />
                    }
                  </button>

                  {/* Transcript toggle — only visible after the message has been played */}
                  {transcripts[index] && (
                    <button
                      onClick={() => setOpenTranscriptIdx(
                        openTranscriptIdx === index ? null : index
                      )}
                      aria-label="Toggle TTS transcript"
                      title="Show how the audio was split by language"
                      className="p-1 rounded text-gray-300 hover:text-gray-500
                                 hover:bg-gray-100 transition-colors text-[10px] font-mono"
                    >
                      TTS
                    </button>
                  )}
                </div>
              )}

              {/* Transcript panel — expandable, shows segments + language flags */}
              {msg.role === 'ai' && openTranscriptIdx === index && transcripts[index] && (
                <div className="mt-1 ml-1 p-2.5 rounded-xl bg-gray-50 border border-gray-100
                               text-[11px] font-mono text-gray-500 space-y-1">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">
                    TTS segments ({transcripts[index].length})
                  </p>
                  {transcripts[index].map((seg, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      {/* Language flag */}
                      <span className="flex-shrink-0">
                        {LANG_FLAGS[seg.lang] ?? seg.lang}
                      </span>
                      {/* Segment text */}
                      <span className="text-gray-700 leading-snug">
                        {seg.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
