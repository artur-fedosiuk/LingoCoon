/**
 * Filename: src/app/api/tts/synthesize/route.ts
 * Description: API route handler to synthesize text into speech using the Google Cloud Text-to-Speech API.
 */
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY;
const GOOGLE_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

interface TTSRequest {
    text: string;
    languageCode: string;
    voiceName?: string;
    ssmlGender?: string;
    pitch?: number;
    speakingRate?: number;
    volumeGainDb?: number;
}

export async function POST(request: NextRequest) {
    try {
        // Validate API key
        if (!GOOGLE_TTS_API_KEY) {
            return NextResponse.json(
                { error: 'TTS service not configured' },
                { status: 500 }
            );
        }

        const body: TTSRequest = await request.json();

        // Validate request
        if (!body.text || !body.languageCode) {
            return NextResponse.json(
                { error: 'Missing required fields: text and languageCode' },
                { status: 400 }
            );
        }

        // Validate text length
        if (body.text.length > 5000) {
            return NextResponse.json(
                { error: 'Text too long (max 5000 characters)' },
                { status: 400 }
            );
        }

        // Prepare voice config
        const voiceConfig: any = {
            languageCode: body.languageCode,
        };

        if (body.voiceName) {
            voiceConfig.name = body.voiceName;
        } else if (body.ssmlGender) {
            voiceConfig.ssmlGender = body.ssmlGender;
        } else {
            voiceConfig.ssmlGender = 'NEUTRAL';
        }

        // Prepare request body for Google TTS API
        const requestBody = {
            input: {
                text: body.text
            },
            voice: voiceConfig,
            audioConfig: {
                audioEncoding: 'MP3',
                pitch: body.pitch || 0,
                speakingRate: body.speakingRate || 1.0,
                volumeGainDb: body.volumeGainDb || 0,
                effectsProfileId: ['small-bluetooth-speaker-class-device']
            }
        };

        // Call Google Cloud TTS API
        const response = await fetch(
            `${GOOGLE_TTS_ENDPOINT}?key=${GOOGLE_TTS_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );

        // Handle API errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Google TTS API error:', errorData);

            if (response.status === 400) {
                return NextResponse.json(
                    { error: 'Invalid parameters' },
                    { status: 400 }
                );
            } else if (response.status === 403) {
                return NextResponse.json(
                    { error: 'Invalid API key or quota exceeded' },
                    { status: 403 }
                );
            } else if (response.status === 429) {
                return NextResponse.json(
                    { error: 'Too many requests, try again later' },
                    { status: 429 }
                );
            } else {
                return NextResponse.json(
                    { error: `API error: ${response.status}` },
                    { status: response.status }
                );
            }
        }

        const data = await response.json();

        if (!data.audioContent) {
            return NextResponse.json(
                { error: 'No audio received from API' },
                { status: 500 }
            );
        }

        // Return the audio content
        return NextResponse.json({
            audioContent: data.audioContent
        });

    } catch (error) {
        console.error('TTS API route error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
