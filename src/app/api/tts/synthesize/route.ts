/**
 * Filename: src/app/api/tts/synthesize/route.ts
 * Description: API route handler using Google Cloud TTS with Service Account JSON env var.
 *
 * On Vercel (and any serverless platform) you cannot read files from disk at runtime.
 * Instead, store the full service-account JSON as a single env var:
 *   GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
 */
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Token cache — persists in memory across requests during the server session
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

// Generate an OAuth2 access token from the JSON service account using JWT
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < cachedToken.expiresAt - 60) {
    return cachedToken.value;
  }

  // Read the service account credentials from the env var (JSON string).
  // On Vercel: set GOOGLE_SERVICE_ACCOUNT_JSON to the full contents of your
  // service-account JSON file (wrap the value in single quotes in the Vercel dashboard).
  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var not set');

  const creds = JSON.parse(credJson);

  const payload = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: creds.token_uri,
    iat: now,
    exp: now + 3600,
  };

  // Create signed JWT with the private key (RS256)
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodeBase64Url = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const headerB64 = encodeBase64Url(header);
  const payloadB64 = encodeBase64Url(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  // Import the PEM private key
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

  // Exchange the JWT for an access token
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

// Convert PEM → DER (ArrayBuffer) without external dependencies
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

        // Get access token from service account
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
