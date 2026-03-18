// src/lib/actions/google-tts-actions.ts
'use server';

import textToSpeech from '@google-cloud/text-to-speech';

const client = new textToSpeech.TextToSpeechClient();

type SupportedLanguage = 'it' | 'en' | 'fr' | 'uk';

const VOICE_MAP: Record<SupportedLanguage, { languageCode: string; name: string }> = {
  it: { languageCode: 'it-IT', name: 'it-IT-Neural2-A' },
  en: { languageCode: 'en-US', name: 'en-US-Neural2-A' },
  fr: { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A' },
  uk: { languageCode: 'uk-UA', name: 'uk-UA-Wavenet-A' },
};

export async function generateAudio(text: string, language: SupportedLanguage = 'it'): Promise<string | null> {
  try {
    if (!text || text.trim() === '') {
      console.warn("Empty text passed to TTS");
      return null;
    }

    const voiceSelection = VOICE_MAP[language] || VOICE_MAP['it'];

    const request = {
      input: { text },
      voice: voiceSelection,
      audioConfig: { audioEncoding: 'MP3' as const },
    };

    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error("No audio content returned from Google");
    }

    const audioBase64 = Buffer.from(response.audioContent).toString('base64');
    return `data:audio/mp3;base64,${audioBase64}`;

  } catch (error) {
    console.error("Error during TTS generation:", error);
    return null;
  }
}