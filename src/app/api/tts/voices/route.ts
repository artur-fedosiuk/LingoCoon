/**
 * Filename: src/app/api/tts/voices/route.ts
 * Description: API route handler to fetch and filter high-quality TTS voices from the Google Cloud Text-to-Speech API.
 */
import { NextRequest, NextResponse } from 'next/server';

// The voices endpoint uses a simple API key (not a service account)
// Note: this endpoint is less critical; the main TTS uses GOOGLE_SERVICE_ACCOUNT_PATH
const GOOGLE_SERVICE_ACCOUNT_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
const GOOGLE_VOICES_ENDPOINT = 'https://texttospeech.googleapis.com/v1/voices';

export async function GET(request: NextRequest) {
    try {
        // Validate API key
        if (!GOOGLE_SERVICE_ACCOUNT_PATH) {
            return NextResponse.json(
                { error: 'TTS service not configured' },
                { status: 500 }
            );
        }

        // Get language code from query params
        const searchParams = request.nextUrl.searchParams;
        const languageCode = searchParams.get('languageCode');

        if (!languageCode) {
            return NextResponse.json(
                { error: 'Missing languageCode parameter' },
                { status: 400 }
            );
        }

        // Call Google Cloud TTS Voices API
        const response = await fetch(
            `${GOOGLE_VOICES_ENDPOINT}?languageCode=${languageCode}&key=${GOOGLE_SERVICE_ACCOUNT_PATH}`
        );

        if (!response.ok) {
            console.error(`Google Voices API error: ${response.status}`);
            return NextResponse.json(
                { error: 'Failed to fetch voices' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Filter for high-quality voices only (Neural2, WaveNet)
        if (data.voices) {
            const highQualityVoices = data.voices.filter((voice: any) => {
                const name = voice.name.toLowerCase();
                return name.includes('neural2') || name.includes('wavenet');
            });

            return NextResponse.json({
                voices: highQualityVoices
            });
        }

        return NextResponse.json({ voices: [] });

    } catch (error) {
        console.error('Voices API route error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
