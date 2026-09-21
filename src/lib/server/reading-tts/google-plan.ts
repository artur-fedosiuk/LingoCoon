import { TtsError, type TtsInput } from '../../reading-tts/contract';

export const GOOGLE_VOICES = {
  en: { female: 'en-US-Chirp3-HD-Achernar', male: 'en-US-Chirp3-HD-Charon' },
  it: { female: 'it-IT-Chirp3-HD-Achernar', male: 'it-IT-Chirp3-HD-Charon' },
  fr: { female: 'fr-FR-Chirp3-HD-Achernar', male: 'fr-FR-Chirp3-HD-Charon' },
  uk: { female: 'uk-UA-Chirp3-HD-Achernar', male: 'uk-UA-Chirp3-HD-Charon' },
} as const;

export function googleVoice(input: Pick<TtsInput, 'language' | 'voice'>): string {
  return GOOGLE_VOICES[input.language][input.voice];
}
export type GoogleSegment = { text: string; start: number; characters: number };

/** Plain text only. Split on lexical boundaries and preserve every input byte. */
export function planGoogleSpeech(input: TtsInput): GoogleSegment[] {
  if (!input.text.isWellFormed()) throw new TtsError('invalid_input');
  const result: GoogleSegment[] = [];
  let text = '';
  let start = 0;
  for (const match of input.text.matchAll(/\S+\s*|\s+/gu)) {
    const unit = match[0];
    if (Buffer.byteLength(unit, 'utf8') > 4800) throw new TtsError('invalid_input');
    if (text && (Buffer.byteLength(text + unit, 'utf8') > 4800 || text.length + unit.length > 700)) {
      result.push({ text, start, characters: text.length });
      start += text.length;
      text = '';
    }
    text += unit;
  }
  if (text) result.push({ text, start, characters: text.length });
  if (!result.length) throw new TtsError('invalid_input');
  return result;
}
