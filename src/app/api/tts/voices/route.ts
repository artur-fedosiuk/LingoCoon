// File: src/app/api/tts/voices/route.ts
// Description: Returns the list of available TTS voices for a given language.
 
import { NextRequest, NextResponse } from 'next/server';

// The Google Cloud TTS endpoint for listing voices.
const GOOGLE_VOICES_ENDPOINT = 'https://texttospeech.googleapis.com/v1/voices';

// ─── HELPERS (same JWT approach as synthesize/route.ts) ──────────────────────

// In-memory token cache — avoids requesting a new token for every voice fetch.
let cachedToken: { value: string; expiresAt: number } | null = null;

/** Converts a PEM private key string to a binary ArrayBuffer for the WebCrypto API. */
function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const binary = Buffer.from(b64, 'base64');
  return binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength);
}

/** Gets a valid OAuth2 access token using the service account JSON env var. */
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Return the cached token if it hasn't expired yet (with a 60-second buffer).
  if (cachedToken && now < cachedToken.expiresAt - 60) {
    return cachedToken.value;
  }

  const credJson = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credJson) throw new Error('GOOGLE_APPLICATION_CREDENTIALS env var not set');

  const creds = JSON.parse(credJson);

  // Build the JWT payload.
  const payload = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: creds.token_uri,
    iat: now,
    exp: now + 3600,
  };

  // Base64url-encode the header and payload.
  const encodeBase64Url = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');
  const headerB64 = encodeBase64Url({ alg: 'RS256', typ: 'JWT' });
  const payloadB64 = encodeBase64Url(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  // Sign the JWT using the private key from the service account.
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
  const jwt = `${signingInput}.${Buffer.from(signature).toString('base64url')}`;

  // Exchange the JWT for a short-lived access token.
  const tokenRes = await fetch(creds.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`);

  const { access_token } = await tokenRes.json();
  cachedToken = { value: access_token, expiresAt: now + 3600 };
  return access_token;
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // Read the languageCode query parameter (e.g. ?languageCode=it-IT).
    const languageCode = request.nextUrl.searchParams.get('languageCode');
    if (!languageCode) {
      return NextResponse.json(
        { error: 'Missing languageCode query parameter' },
        { status: 400 }
      );
    }

    // Get a valid access token from the service account.
    const accessToken = await getAccessToken();

    // Call the Google Cloud TTS voices endpoint.
    const response = await fetch(
      `${GOOGLE_VOICES_ENDPOINT}?languageCode=${languageCode}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Google Voices API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Filter to only return high-quality Neural2 and WaveNet voices.
    const highQualityVoices = (data.voices ?? []).filter((voice: { name: string }) => {
      const name = voice.name.toLowerCase();
      return name.includes('neural2') || name.includes('wavenet');
    });

    return NextResponse.json({ voices: highQualityVoices });
  } catch (error) {
    console.error('Voices API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
