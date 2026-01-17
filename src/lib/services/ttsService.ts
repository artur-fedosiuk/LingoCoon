/**
 * Filename: src/lib/services/ttsService.ts
 * Description: Client-side service wrapper for Text-to-Speech functionality, communicating with the server-side proxy.
 */
/**
 * Text-to-Speech Service with Google Cloud TTS
 * Secure implementation using server-side API routes
 */

// Audio state management
let currentAudio: HTMLAudioElement | null = null;
let isPlaying = false;

// Voice cache per language
const voiceCache = new Map<string, any[]>();

// Audio cache for text+voice
const audioCache = new Map<string, string>();
const MAX_CACHE_AUDIO = 50;

// Language code mapping: short -> BCP-47 full
const LANGUAGE_MAP: Record<string, string> = {
    'it': 'it-IT',
    'en': 'en-US',
    'uk': 'uk-UA',
    'fr': 'fr-FR',
    'it-IT': 'it-IT',
    'en-US': 'en-US',
    'en-GB': 'en-GB',
    'uk-UA': 'uk-UA',
    'fr-FR': 'fr-FR',
    'default': 'en-US'
};

interface TTSOptions {
    pitch?: number;
    speakingRate?: number;
    volumeGainDb?: number;
}

interface Voice {
    name: string;
    languageCodes: string[];
    ssmlGender: string;
    naturalSampleRateHertz: number;
}

/**
 * Convert short language code to BCP-47 full code
 */
function toGoogleLanguageCode(langCode: string): string {
    if (!langCode) return LANGUAGE_MAP['default'];
    const code = langCode.toLowerCase().split('-')[0];
    return LANGUAGE_MAP[langCode] || LANGUAGE_MAP[code] || LANGUAGE_MAP['default'];
}

/**
 * Initialize TTS service
 */
export function initializeTTS(): boolean {
    console.log('Google Cloud TTS initialized (secure server-side mode)');
    return true;
}

/**
 * Get available voices for a specific language
 */
async function getVoicesForLanguage(languageCode: string): Promise<Voice[]> {
    const googleLanguageCode = toGoogleLanguageCode(languageCode);

    try {
        if (voiceCache.has(googleLanguageCode)) {
            console.log(`Voices for ${googleLanguageCode} loaded from cache`);
            return voiceCache.get(googleLanguageCode)!;
        }

        console.log(`Fetching voices for ${googleLanguageCode}...`);

        // Call our secure API route instead of Google directly
        const response = await fetch(
            `/api/tts/voices?languageCode=${googleLanguageCode}`
        );

        if (!response.ok) {
            console.error(`Error fetching voices: ${response.status} for language: ${googleLanguageCode}`);
            return [];
        }

        const data = await response.json();

        if (!data.voices || data.voices.length === 0) {
            console.warn(`No voices found for ${googleLanguageCode}`);
            return [];
        }

        console.log(`${data.voices.length} high-quality voices available for ${googleLanguageCode}`);

        voiceCache.set(googleLanguageCode, data.voices);

        return data.voices;

    } catch (error) {
        console.error(`Error getVoicesForLanguage for ${googleLanguageCode}:`, error);
        return [];
    }
}

/**
 * Select random voice from array
 */
function selectRandomVoice(voices: Voice[]): Voice | null {
    if (!voices || voices.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * voices.length);
    const selectedVoice = voices[randomIndex];

    console.log(`Random voice selected: ${selectedVoice.name} (${selectedVoice.ssmlGender})`);

    return selectedVoice;
}

/**
 * Generate cache key for audio
 */
function generateAudioCacheKey(text: string, language: string, voiceName: string): string {
    return `${language}:${voiceName}:${text.substring(0, 50)}`;
}

/**
 * Read text using Google Cloud TTS with RANDOM voice
 */
export async function readText(
    text: string,
    language: string = 'en-US',
    options: TTSOptions = {}
): Promise<void> {
    const googleLanguageCode = toGoogleLanguageCode(language);
    console.log(`TTS: requested language "${language}" -> Google code "${googleLanguageCode}"`);

    try {
        // Validate text
        if (!text || text.trim().length === 0) {
            throw new Error('Empty text');
        }

        if (text.length > 5000) {
            throw new Error('Text too long (max 5000 characters)');
        }

        // Stop previous audio
        if (isPlaying && currentAudio) {
            stopTTS();
        }

        // GET AVAILABLE VOICES FOR LANGUAGE
        const availableVoices = await getVoicesForLanguage(googleLanguageCode);

        // Prepare voice config
        let voiceConfig: any;
        let voiceName: string | undefined;

        if (availableVoices.length > 0) {
            // SELECT RANDOM VOICE
            const randomVoice = selectRandomVoice(availableVoices);

            if (randomVoice) {
                voiceConfig = {
                    languageCode: googleLanguageCode,
                    name: randomVoice.name
                };
                voiceName = randomVoice.name;

                // Check audio cache for this specific voice
                const cacheKey = generateAudioCacheKey(text, googleLanguageCode, randomVoice.name);

                if (audioCache.has(cacheKey)) {
                    console.log('Specific audio loaded from cache');
                    const audioUrl = audioCache.get(cacheKey)!;
                    return playAudio(audioUrl);
                }
            }
        } else {
            // Fallback: use base configuration
            console.warn(`No voices found, using fallback for ${googleLanguageCode}`);
            voiceConfig = {
                languageCode: googleLanguageCode,
                ssmlGender: 'NEUTRAL'
            };
        }

        // CALL SECURE API ROUTE
        console.log(`Requesting TTS synthesis via secure API for language: ${googleLanguageCode}...`);

        const requestBody = {
            text: text,
            languageCode: googleLanguageCode,
            voiceName: voiceName,
            ssmlGender: voiceConfig.ssmlGender,
            pitch: options.pitch || 0,
            speakingRate: options.speakingRate || 1.0,
            volumeGainDb: options.volumeGainDb || 0
        };

        const response = await fetch('/api/tts/synthesize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        // Handle API errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`TTS API error for language ${googleLanguageCode}:`, errorData);

            if (response.status === 400) {
                throw new Error(`Invalid parameters for language: ${googleLanguageCode}`);
            } else if (response.status === 403) {
                throw new Error('Invalid API key or quota exceeded');
            } else if (response.status === 429) {
                throw new Error('Too many requests, try again later');
            } else {
                throw new Error(`API error: ${response.status}`);
            }
        }

        const data = await response.json();

        if (!data.audioContent) {
            throw new Error('No audio received from API');
        }

        // Create audio URL from Base64
        const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;

        // Save to cache (only if using specific voice)
        if (voiceName) {
            const cacheKey = generateAudioCacheKey(text, googleLanguageCode, voiceName);
            audioCache.set(cacheKey, audioUrl);

            // Manage cache size
            if (audioCache.size > MAX_CACHE_AUDIO) {
                const firstKey = audioCache.keys().next().value;
                if (firstKey !== undefined) {
                    audioCache.delete(firstKey);
                }
            }
        }

        console.log('Audio received successfully');

        // Play
        return playAudio(audioUrl);

    } catch (error) {
        console.error(`Failed TTS attempt with language: ${googleLanguageCode}`, error);
        isPlaying = false;
        throw error;
    }
}

/**
 * Play audio from URL (internal helper)
 */
function playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
        currentAudio = new Audio(audioUrl);

        currentAudio.onloadeddata = () => {
            console.log('Playback started');
            isPlaying = true;
        };

        currentAudio.onended = () => {
            console.log('Playback completed');
            isPlaying = false;
            currentAudio = null;
            resolve();
        };

        currentAudio.onerror = (error) => {
            console.error('Audio playback error:', error);
            isPlaying = false;
            currentAudio = null;
            reject(new Error('Audio playback error'));
        };

        // Start playback
        currentAudio.play().catch(err => {
            console.error('Error during play():', err);
            isPlaying = false;
            reject(err);
        });
    });
}

/**
 * Stop any TTS playback in progress
 */
export function stopTTS(): void {
    if (currentAudio) {
        try {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
            isPlaying = false;
            console.log('TTS stopped');
        } catch (err) {
            console.error('Error stopping TTS:', err);
        }
    }
}

/**
 * Check if TTS is playing
 */
export function isTTSPlaying(): boolean {
    return isPlaying && currentAudio !== null && !currentAudio.paused;
}

/**
 * Pause TTS
 */
export function pauseTTS(): void {
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        isPlaying = false;
        console.log('TTS paused');
    }
}

/**
 * Resume TTS from pause
 */
export function resumeTTS(): void {
    if (currentAudio && currentAudio.paused) {
        currentAudio.play();
        isPlaying = true;
        console.log('TTS resumed');
    }
}

/**
 * Clear all caches
 */
export function clearCache(): void {
    voiceCache.clear();
    audioCache.clear();
    console.log('Caches cleared (voices + audio)');
}

/**
 * Get cache statistics
 */
export function getCacheStatistics() {
    return {
        cachedLanguages: voiceCache.size,
        cachedAudioFiles: audioCache.size,
        maxAudioCache: MAX_CACHE_AUDIO,
        audioCacheUsagePercent: Math.round((audioCache.size / MAX_CACHE_AUDIO) * 100)
    };
}

/**
 * Pre-load voices for a language (optimization)
 */
export async function preloadVoices(languageCode: string): Promise<void> {
    await getVoicesForLanguage(languageCode);
    console.log(`Voices pre-loaded for ${languageCode}`);
}

// Initialize on import
initializeTTS();