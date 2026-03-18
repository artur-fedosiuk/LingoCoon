/**
 * Filename: src/app/api/tts/synthesize/route.ts
 * Description: API route handler usando Google Cloud TTS SDK con Service Account.
 */
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

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

// Genera un access token OAuth2 dal service account JSON usando JWT
async function getAccessToken(): Promise<string> {
  // Legge il JSON del service account
  const credPath = process.env.GOOGLE_TTS_API_KEY;
  if (!credPath) throw new Error('GOOGLE_TTS_API_KEY not set');

  const absolutePath = path.isAbsolute(credPath)
    ? credPath
    : path.join(process.cwd(), credPath);

  const creds = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: creds.token_uri,
    iat: now,
    exp: now + 3600,
  };

  // Crea JWT firmato con la private key (RS256)
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodeBase64Url = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const headerB64 = encodeBase64Url(header);
  const payloadB64 = encodeBase64Url(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  // Importa la chiave privata PEM
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(creds.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  const signatureB64 = Buffer.from(signature).toString('base64url');
  const jwt = `${signingInput}.${signatureB64}`;

  // Scambia il JWT per un access token
  const tokenRes = await fetch(creds.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const { access_token } = await tokenRes.json();
  return access_token;
}

// Converte PEM → DER (ArrayBuffer) senza dipendenze esterne
function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const binary = Buffer.from(b64, 'base64');
  return binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength);
}

export async function POST(request: NextRequest) {
    try {
        const body: TTSRequest = await request.json();

        if (!body.text || !body.languageCode) {
            return NextResponse.json(
                { error: 'Missing required fields: text and languageCode' },
                { status: 400 }
            );
        }

        if (body.text.length > 5000) {
            return NextResponse.json(
                { error: 'Text too long (max 5000 characters)' },
                { status: 400 }
            );
        }

        // Ottieni access token dal service account
        const accessToken = await getAccessToken();

        const voiceConfig: Record<string, string> = {
            languageCode: body.languageCode,
        };
        if (body.voiceName) {
            voiceConfig.name = body.voiceName;
        } else {
            voiceConfig.ssmlGender = body.ssmlGender ?? 'NEUTRAL';
        }

        const requestBody = {
            input: { text: body.text },
            voice: voiceConfig,
            audioConfig: {
                audioEncoding: 'MP3',
                pitch: body.pitch ?? 0,
                speakingRate: body.speakingRate ?? 1.0,
                volumeGainDb: body.volumeGainDb ?? 0,
            },
        };

        const response = await fetch(GOOGLE_TTS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Google TTS API error:', errorData);
            return NextResponse.json(
                { error: `Google TTS error: ${response.status}`, detail: errorData },
                { status: response.status }
            );
        }

        const data = await response.json();

        if (!data.audioContent) {
            return NextResponse.json(
                { error: 'No audio received from API' },
                { status: 500 }
            );
        }

        return NextResponse.json({ audioContent: data.audioContent });

    } catch (error) {
        console.error('TTS API route error:', error);
        return NextResponse.json(
            { error: 'Internal server error', detail: String(error) },
            { status: 500 }
        );
    }
}
