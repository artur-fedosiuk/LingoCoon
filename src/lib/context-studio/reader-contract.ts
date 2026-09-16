import { z } from 'zod';
import type { ContextLanguage, ContextRange, ContextUnit } from '../../types/context-studio';

export const CONTEXT_LANGUAGES = ['en', 'it', 'fr', 'uk'] as const;
export const MIN_SOURCE_WORDS = 100;
export const MAX_SOURCE_WORDS = 400;
export const MAX_SOURCE_CHARACTERS = 3_000;
export const MAX_SELECTION_CHARACTERS = 160;
export const MAX_FOCUS_PHRASES = 3;

export function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/u).length : 0;
}

export function normalizeContextLanguage(value: string | null): ContextLanguage | null {
  const aliases: Record<string, ContextLanguage> = { english: 'en', italian: 'it', italiano: 'it', french: 'fr', ukrainian: 'uk' };
  const normalized = value?.trim().toLowerCase() ?? '';
  const code = aliases[normalized] ?? normalized.split(/[-_]/u)[0];
  return CONTEXT_LANGUAGES.find((language) => language === code) ?? null;
}

// The target language is deliberately not a session source-language default.
export function getContextLanguageDefaults(profile: { nativeLanguage: string | null; targetLanguage: string | null }) {
  return { nativeLanguage: normalizeContextLanguage(profile.nativeLanguage), sourceLanguage: null };
}

export const contextSourceSchema = z.string().min(1).max(MAX_SOURCE_CHARACTERS)
  .refine((value) => countWords(value) >= MIN_SOURCE_WORDS && countWords(value) <= MAX_SOURCE_WORDS);
export const contextSessionSchema = z.object({
  sourceText: contextSourceSchema,
  sourceLanguage: z.enum(CONTEXT_LANGUAGES),
  nativeLanguage: z.enum(CONTEXT_LANGUAGES),
  revision: z.number().int().nonnegative(),
}).strict();
export const contextSelectionSchema = contextSessionSchema.extend({
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  translatedContext: z.string().max(6000).optional(),
}).strict().superRefine(({ sourceText, start, end }, context) => {
  if (end <= start || end > sourceText.length || end - start > MAX_SELECTION_CHARACTERS || !sourceText.slice(start, end).trim()) {
    context.addIssue({ code: 'custom', path: ['start'], message: 'Invalid source range.' });
  }
});

export function buildContextUnits(sourceText: string, language: ContextLanguage): ContextUnit[] {
  const units: ContextUnit[] = [];
  const segmenter = new Intl.Segmenter(language, { granularity: 'sentence' });
  let paragraph = 0;
  for (const match of sourceText.matchAll(/[^\r\n]+(?:\r?\n(?!\s*\r?\n)[^\r\n]+)*/gu)) {
    const paragraphText = match[0];
    const paragraphStart = match.index;
    for (const segment of segmenter.segment(paragraphText)) {
      const leading = segment.segment.length - segment.segment.trimStart().length;
      const start = paragraphStart + segment.index + leading;
      const end = paragraphStart + segment.index + segment.segment.trimEnd().length;
      if (end > start) units.push({ id: `s${start}-${end}`, paragraph, start, end, text: sourceText.slice(start, end) });
    }
    paragraph += 1;
  }
  return units;
}

export function containingContext(source: string, units: ContextUnit[], range: ContextRange): string {
  const intersecting = units.filter((unit) => unit.start < range.end && unit.end > range.start);
  return intersecting.length ? source.slice(intersecting[0].start, intersecting[intersecting.length - 1].end) : '';
}
