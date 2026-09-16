export type ContextLanguage = 'en' | 'it' | 'fr' | 'uk';

export interface ContextLanguages {
  sourceLanguage: ContextLanguage;
  nativeLanguage: ContextLanguage;
}

export interface ContextUnit {
  id: string;
  paragraph: number;
  start: number;
  end: number;
  text: string;
}

export interface ContextRange {
  start: number;
  end: number;
}

export interface ContextSession extends ContextLanguages {
  revision: number;
  sourceText: string;
}

export interface ContextExplanation extends ContextLanguages {
  translation: string;
  partOfSpeech: string;
  meaning: string;
  grammar: string | null;
  example: string;
  exampleTranslation: string;
}

export interface ContextTranslation extends ContextLanguages {
  units: Array<{ id: string; translation: string }>;
}

export type ContextStudioErrorKey =
  | 'feature_unavailable'
  | 'invalid_input'
  | 'invalid_response'
  | 'service_unavailable';

export type ContextResult<T> = { value: T; errorKey?: never } | { value?: never; errorKey: ContextStudioErrorKey };
