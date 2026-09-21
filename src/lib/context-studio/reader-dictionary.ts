import type { ContextLanguage, ContextSession } from '../../types/context-studio';
import type { ReaderSelection, SentencePair } from './reader-tokens';
import { normalizeReaderWord } from './reader-tokens';

export interface DictionarySense {
  partOfSpeech: string;
  translations: string[];
  definition: string | null;
}
export interface ReaderDictionary {
  sourceLanguage: ContextLanguage;
  nativeLanguage: ContextLanguage;
  senses: DictionarySense[];
}

const partOfSpeechLabels = {
  'preposition / infinitive marker': { it: 'preposizione / indicatore dell’infinito', fr: 'préposition / marqueur de l’infinitif', uk: 'прийменник / маркер інфінітива' },
  verb: { it: 'verbo', fr: 'verbe', uk: 'дієслово' },
  'verb / noun': { it: 'verbo / sostantivo', fr: 'verbe / nom', uk: 'дієслово / іменник' },
  noun: { it: 'sostantivo', fr: 'nom', uk: 'іменник' },
  adverb: { it: 'avverbio', fr: 'adverbe', uk: 'прислівник' },
} as const;

const grammarLabels: Record<string, Record<Exclude<ContextLanguage, 'en'>, string>> = {
  ...partOfSpeechLabels,
  adjective: { it: 'aggettivo', fr: 'adjectif', uk: 'прикметник' },
  pronoun: { it: 'pronome', fr: 'pronom', uk: 'займенник' },
  preposition: { it: 'preposizione', fr: 'préposition', uk: 'прийменник' },
  conjunction: { it: 'congiunzione', fr: 'conjonction', uk: 'сполучник' },
  determiner: { it: 'determinante', fr: 'déterminant', uk: 'визначник' },
  countable: { it: 'numerabile', fr: 'dénombrable', uk: 'злічуваний' },
  uncountable: { it: 'non numerabile', fr: 'indénombrable', uk: 'незлічуваний' },
  singular: { it: 'singolare', fr: 'singulier', uk: 'однина' },
  plural: { it: 'plurale', fr: 'pluriel', uk: 'множина' },
};

/** Translate recognizable grammar tags only; never rewrite free-form source quotations. */
export function localizeReaderGrammar(value: string, language: ContextLanguage): string {
  if (language === 'en') return value;
  const labels = value.split(',').map((part) => grammarLabels[part.trim().toLowerCase()]?.[language]);
  return labels.length && labels.every((label) => label !== undefined) ? labels.join(', ') : value;
}

// Small editorial glossary for instant offline previews, not a complete dictionary.
const englishGlossary: Record<string, { partOfSpeech: keyof typeof partOfSpeechLabels; it: string[]; fr: string[]; uk: string[] }> = {
  to: { partOfSpeech: 'preposition / infinitive marker', it: ['a', 'verso', 'per', 'di'], fr: ['à', 'vers', 'pour', 'de'], uk: ['до', 'у напрямку', 'щоб'] },
  read: { partOfSpeech: 'verb', it: ['leggere'], fr: ['lire'], uk: ['читати'] },
  love: { partOfSpeech: 'verb / noun', it: ['amare', 'amore'], fr: ['aimer', 'amour'], uk: ['любити', 'любов'] },
  bank: { partOfSpeech: 'noun', it: ['banca', 'riva'], fr: ['banque', 'rive'], uk: ['банк', 'берег'] },
  colleague: { partOfSpeech: 'noun', it: ['collega'], fr: ['collègue'], uk: ['колега'] },
  success: { partOfSpeech: 'noun', it: ['successo', 'riuscita'], fr: ['succès', 'réussite'], uk: ['успіх'] },
  today: { partOfSpeech: 'adverb', it: ['oggi'], fr: ['aujourd’hui'], uk: ['сьогодні'] },
  together: { partOfSpeech: 'adverb', it: ['insieme'], fr: ['ensemble'], uk: ['разом'] },
  language: { partOfSpeech: 'noun', it: ['lingua', 'linguaggio'], fr: ['langue', 'langage'], uk: ['мова'] },
  learn: { partOfSpeech: 'verb', it: ['imparare'], fr: ['apprendre'], uk: ['вчитися', 'дізнаватися'] },
};

export function localReaderDictionary(word: string, source: ContextLanguage, target: ContextLanguage): ReaderDictionary | null {
  if (source !== 'en' || target === 'en') return null;
  const entry = englishGlossary[normalizeReaderWord(word)];
  if (!entry) return null;
  return { sourceLanguage: source, nativeLanguage: target, senses: [{ partOfSpeech: partOfSpeechLabels[entry.partOfSpeech][target], translations: entry[target], definition: null }] };
}

export function dictionaryTranslations(entry: ReaderDictionary | null): string[] {
  return [...new Set(entry?.senses.flatMap((sense) => sense.translations) ?? [])];
}
export function readerDictionaryKey(session: ContextSession, word: ReaderSelection): string {
  return JSON.stringify([session.sourceLanguage, word.normalized, session.nativeLanguage]);
}
export function readerExplanationKey(session: ContextSession, word: ReaderSelection, pair: SentencePair): string {
  return JSON.stringify([session.sourceLanguage, word.normalized, pair.text, word.start - pair.start, pair.translatedText, session.nativeLanguage]);
}
export const DICTIONARY_PROVIDERS = [{ id: 'wiktionary', label: 'Wiktionary', origin: 'https://en.wiktionary.org/wiki/' }] as const;
