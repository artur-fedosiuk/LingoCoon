/**
 * Filename: src/app/api/tts/synthesize/route.ts
 * Description: API route handler using Google Cloud TTS.
 * Reads the Service Account JSON from the local file system.
 */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const GOOGLE_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Cache in RAM per evitare di richiedere un nuovo token a ogni singola parola
let cachedToken: { value: string; expiresAt: number } | null = null;

interface TTSRequest {
    text: string;
    languageCode: string;
    voiceName?: string;
    ssmlGender?: string;
    pitch?: number;
    speakingRate?: number;
    volumeGainDb?: number;
}

// Generazione del token OAuth2 (JSON Web Token)
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  if (cachedToken && now < cachedToken.expiresAt - 60) {
    return cachedToken.value;
  }

  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS env var not set in .env.local');
  }

  // LETTURA FISICA DAL DISCO (Risolve l'Errore 500)
  const absolutePath = path.resolve(process.cwd(), keyPath);
  const fileContent = fs.readFileSync(absolutePath, 'utf8');
  const creds = JSON.parse(fileContent);

  const payload = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: creds.token_uri,
    iat: now,
    exp: now + 3600,
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const encodeBase64Url = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const headerB64 = encodeBase64Url(header);
  const payloadB64 = encodeBase64Url(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  // Importazione della chiave crittografica
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

  // Scambio del JWT con il Token di Accesso
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
  cachedToken = { value: access_token, expiresAt: now + 3600 };
  return access_token;
}

// Utilità per la conversione del formato della chiave
function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const binary = Buffer.from(b64, 'base64');
  return binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength);
}

// Endpoint principale POST
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