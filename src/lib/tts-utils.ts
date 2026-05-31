/**
 * src/lib/tts-utils.ts
 *
 * Utilities for multilingual text-to-speech processing.
 *
 * Architecture: segment-based audio (not SSML)
 *
 * Why not SSML <lang> tags?
 * Google Neural2 voices are single-language models. Even though the SSML <lang>
 * tag is documented, Neural2 voices do not switch phoneme rules for a different
 * language — they apply their native phonetics to all segments.
 *
 * Correct approach:
 *   Parse the AI response into language segments using <tl> markers.
 *   Make one TTS request per segment with the voice native to that language.
 *   Play segments sequentially using the Web Audio API (gapless, pre-scheduled).
 *
 * Result: "La parola bonjour significa ciao" is synthesized as:
 *   → "La parola significa ciao" via it-IT-Neural2-A (correct Italian phonetics)
 *   → "bonjour"                  via fr-FR-Neural2-A (correct French phonetics)
 *
 * CRITICAL ordering constraint in parseSegments:
 *   stripTTSNoise removes < and > characters (not in the allowed Unicode set).
 *   It must only be called on plain text segments AFTER tag boundaries are resolved,
 *   never on raw text that still contains <tl> markup.
 */

// ─── LANGUAGE MAPS ────────────────────────────────────────────────────────────

export const ISO_TO_BCP47: Record<string, string> = {
  en: 'en-US',
  it: 'it-IT',
  fr: 'fr-FR',
  uk: 'uk-UA',
  de: 'de-DE',
  es: 'es-ES',
  pt: 'pt-PT',
  pl: 'pl-PL',
  ru: 'ru-RU',
  ja: 'ja-JP',
  zh: 'zh-CN',
  ar: 'ar-XA',
  ko: 'ko-KR',
};

// ─── VOICE GENDER PREFERENCE ──────────────────────────────────────────────────

/**
 * PREFERRED_GENDER — single source of truth for voice gender across the entire app.
 * Change this one constant to switch every TTS voice in the app.
 *
 * Note on Ukrainian: Google has no male Neural2 voice for uk-UA.
 * uk-UA-Wavenet-A is female regardless of this setting.
 */
export type VoiceGender = 'FEMALE' | 'MALE';
export const PREFERRED_GENDER: VoiceGender = 'FEMALE';

const VOICES_FEMALE: Record<string, string> = {
  'it-IT': 'it-IT-Neural2-A',
  'fr-FR': 'fr-FR-Neural2-A',
  'en-US': 'en-US-Neural2-F',
  'uk-UA': 'uk-UA-Wavenet-A',
  'de-DE': 'de-DE-Neural2-F',
  'es-ES': 'es-ES-Neural2-A',
  'pt-PT': 'pt-PT-Wavenet-A',
};

const VOICES_MALE: Record<string, string> = {
  'it-IT': 'it-IT-Neural2-C',
  'fr-FR': 'fr-FR-Neural2-B',
  'en-US': 'en-US-Neural2-D',
  'uk-UA': 'uk-UA-Wavenet-A', // No male Neural2 available — female fallback.
  'de-DE': 'de-DE-Neural2-B',
  'es-ES': 'es-ES-Neural2-B',
  'pt-PT': 'pt-PT-Wavenet-D',
};

// ─── PUBLIC UTILITIES ─────────────────────────────────────────────────────────

export function isoToBcp47(iso: string): string {
  return ISO_TO_BCP47[iso.toLowerCase()] ?? `${iso}-${iso.toUpperCase()}`;
}

/** Returns the voice name matching PREFERRED_GENDER for a BCP-47 locale code. */
export function getRecommendedVoice(bcp47: string): string | undefined {
  return (PREFERRED_GENDER === 'FEMALE' ? VOICES_FEMALE : VOICES_MALE)[bcp47];
}

/**
 * parseDisplayText — strips <tl>…</tl> markers for UI rendering.
 * These markers must never be visible to the user.
 */
export function parseDisplayText(text: string): string {
  return text.replace(/<\/?tl>/gi, '');
}

/**
 * stripTTSNoise — removes characters that TTS engines read aloud as their Unicode name.
 *
 * ❌ ✅ ⚠️ → read as "red cross mark", "check mark button", "warning sign"
 * → ← ⟶   → read as "rightwards arrow", "rightwards double arrow"
 *
 * Keeps: Unicode letters (\p{L}), digits (\p{N}), whitespace, common punctuation.
 * Replaces everything else with a space.
 * \p{L} covers ALL Unicode scripts — safe for any language.
 *
 * MUST only be called on plain text segments, never on raw text with <tl> tags.
 */
export function stripTTSNoise(text: string): string {
  return text
    .replace(/[^\p{L}\p{N}\s.,!?;:'"()\-–—«»]/gu, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─── SEGMENT-BASED TTS ────────────────────────────────────────────────────────

/**
 * A single audio segment: plain text in a specific language.
 * Each segment maps to one TTS API request with the correct native voice.
 */
export interface TTSSegment {
  /** Plain text to synthesize — stripped of all markup and noise characters. */
  text: string;
  /** ISO 639-1 language code (e.g. 'it', 'fr'). */
  lang: string;
}

/**
 * parseSegments — splits AI response text into language-tagged plain-text segments.
 *
 * Input:  "La parola <tl>bonjour</tl> significa ciao."
 * Output: [
 *   { text: "La parola significa ciao.", lang: "it" },  ← native segment
 *   { text: "bonjour",                  lang: "fr" },  ← target segment
 * ]
 *
 * Wait — why is "significa ciao" in the first segment and not after "bonjour"?
 * The segment array preserves ORDER. The output above is wrong in the comment —
 * segments are produced in text order:
 *   [
 *     { text: "La parola",      lang: "it" },
 *     { text: "bonjour",        lang: "fr" },
 *     { text: "significa ciao", lang: "it" },
 *   ]
 *
 * Processing steps (order matters):
 *   1. Strip non-<tl> HTML/XML (SSML injection protection) — preserves <tl> structure.
 *   2. If no targetLang or no <tl> markers → single native segment.
 *   3. Split on <tl>…</tl> boundaries.
 *   4. Apply stripTTSNoise to each PLAIN TEXT segment (safe, no markup left).
 *   5. Discard empty segments.
 *
 * @param rawText    AI response text, possibly containing <tl>…</tl> markers.
 * @param nativeLang ISO 639-1 code of the user's native language.
 * @param targetLang ISO 639-1 code of the language being studied, or null.
 */
export function parseSegments(
  rawText: string,
  nativeLang: string,
  targetLang: string | null,
): TTSSegment[] {
  // Step 1: Remove any HTML/XML tags except our <tl> markers.
  // NEVER call stripTTSNoise here — it would destroy <tl> boundaries.
  const sanitized = rawText.replace(/<(?!\/?tl\s*>)[^>]*>/gi, '');

  const pushSegment = (text: string, lang: string, out: TTSSegment[]): void => {
    const clean = stripTTSNoise(text); // Safe: called on plain text only.
    if (clean.length > 0) out.push({ text: clean, lang });
  };

  // Step 2: No target language or no <tl> markers → single native segment.
  if (!targetLang || !sanitized.includes('<tl>')) {
    const segments: TTSSegment[] = [];
    pushSegment(parseDisplayText(sanitized), nativeLang, segments);
    return segments;
  }

  // Step 3–5: Split on <tl>…</tl> boundaries.
  const segments: TTSSegment[] = [];
  const TL_PATTERN = /<tl>(.*?)<\/tl>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TL_PATTERN.exec(sanitized)) !== null) {
    // Native text before this <tl> block.
    pushSegment(sanitized.slice(lastIndex, match.index), nativeLang, segments);
    // Target text inside <tl>…</tl>.
    pushSegment(match[1] ?? '', targetLang, segments);
    lastIndex = match.index + match[0].length;
  }

  // Remaining native text after the last <tl> block.
  pushSegment(sanitized.slice(lastIndex), nativeLang, segments);

  return segments;
}
