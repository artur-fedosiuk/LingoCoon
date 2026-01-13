/**
 * Translation service using MyMemory API with caching
 */

const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';

// Translation cache to avoid duplicate requests
const translationCache = new Map<string, TranslationResult>();

// Common language code mappings
const LANGUAGE_CODES: Record<string, string> = {
  'english': 'en',
  'italian': 'it',
  'spanish': 'es',
  'french': 'fr',
  'german': 'de',
  'portuguese': 'pt',
  'japanese': 'ja',
  'chinese': 'zh',
  'korean': 'ko',
  'arabic': 'ar',
  'dutch': 'nl',
  'polish': 'pl',
  'turkish': 'tr',
  'ukrainian': 'uk'
};

interface TranslationAlternative {
  text: string;
  confidence: number;
  source: string;
}

interface TranslationResult {
  success: boolean;
  originalText: string;
  translation: string | null;
  confidence?: number;
  fromLang?: string;
  toLang?: string;
  alternatives: TranslationAlternative[];
  metadata?: {
    timestamp: string;
    source: string;
  };
  error?: string;
}

/**
 * Translate text from one language to another
 */
export async function translateText(
  text: string,
  fromLang: string = 'en',
  toLang: string = 'it'
): Promise<TranslationResult> {
  try {
    // Input validation
    if (!text || text.trim().length === 0) {
      throw new Error('Empty text');
    }

    if (text.length > 500) {
      throw new Error('Text too long (max 500 characters)');
    }

    // Check cache
    const cacheKey = `${text}-${fromLang}-${toLang}`;
    if (translationCache.has(cacheKey)) {
      console.log('Translation loaded from cache');
      return translationCache.get(cacheKey)!;
    }

    // Build URL
    const params = new URLSearchParams({
      q: text,
      langpair: `${fromLang}|${toLang}`
    });

    const url = `${MYMEMORY_API_URL}?${params.toString()}`;

    // API call
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Verify response
    if (data.responseStatus !== 200) {
      throw new Error(data.responseDetails || 'API error');
    }

    // Prepare result
    const result: TranslationResult = {
      success: true,
      originalText: text,
      translation: data.responseData.translatedText,
      confidence: parseFloat(data.responseData.match || 0),
      fromLang,
      toLang,
      alternatives: [],
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'MyMemory'
      }
    };

    // Add alternative translations (if available)
    if (data.matches && Array.isArray(data.matches)) {
      result.alternatives = data.matches
        .filter((m: any) => m.translation !== result.translation)
        .slice(0, 3)
        .map((m: any) => ({
          text: m.translation,
          confidence: parseFloat(m.match || 0),
          source: m.reference || 'Community'
        }));
    }

    // Save to cache
    translationCache.set(cacheKey, result);

    // Limit cache size (max 100 items)
    if (translationCache.size > 100) {
      const firstKey = translationCache.keys().next().value;
      if (firstKey) translationCache.delete(firstKey);
    }

    console.log('Translation completed:', result.translation);

    return result;

  } catch (error: any) {
    console.error('Translation error:', error);

    return {
      success: false,
      error: error.message,
      originalText: text,
      translation: null,
      alternatives: []
    };
  }
}

/**
 * Automatically detect text language
 */
export async function detectLanguage(text: string): Promise<string> {
  try {
    // MyMemory doesn't have dedicated endpoint, use heuristics
    const result = await translateText(text, 'auto', 'en');

    if (result.success && result.translation !== text) {
      return 'unknown';
    }

    return 'en';
  } catch (error) {
    console.error('Language detection error:', error);
    return 'unknown';
  }
}

/**
 * Translate with automatic source language detection
 */
export async function translateAuto(
  text: string,
  toLang: string = 'it'
): Promise<TranslationResult> {
  return translateText(text, 'auto', toLang);
}

/**
 * Get multiple simultaneous translations (for comparison)
 */
export async function translateMultiple(
  text: string,
  fromLang: string,
  toLangs: string[]
): Promise<{
  success: boolean;
  translations?: Array<{
    language: string;
    translation: string | null;
    confidence?: number;
  }>;
  error?: string;
}> {
  try {
    const promises = toLangs.map(lang =>
      translateText(text, fromLang, lang)
    );

    const results = await Promise.all(promises);

    return {
      success: true,
      translations: results.map((r, i) => ({
        language: toLangs[i],
        translation: r.translation,
        confidence: r.confidence
      }))
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Suggest translations during typing (with debounce)
 */
let suggestionTimeout: NodeJS.Timeout | null = null;

export function suggestTranslation(
  text: string,
  fromLang: string,
  toLang: string,
  callback: (result: TranslationResult | null) => void,
  delay: number = 500
): void {
  // Cancel previous timer
  if (suggestionTimeout) {
    clearTimeout(suggestionTimeout);
  }

  // Don't suggest for very short texts
  if (text.trim().length < 3) {
    callback(null);
    return;
  }

  // Set new timer
  suggestionTimeout = setTimeout(async () => {
    const result = await translateText(text, fromLang, toLang);
    callback(result);
  }, delay);
}

/**
 * Clear translation cache
 */
export function clearCache(): void {
  translationCache.clear();
  console.log('Translation cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: translationCache.size,
    limit: 100
  };
}

/**
 * Convert language name to code (helper)
 */
export function getLanguageCode(languageName: string): string {
  const name = languageName.toLowerCase();
  return LANGUAGE_CODES[name] || 'en';
}