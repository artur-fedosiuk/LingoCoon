/**
 * Filename: src/app/api/tts/synthesize/route.ts
 * Description: API route handler using Google Cloud TTS.
 *
 * Credentials strategy:
 * Instead of reading a JSON key file from disk (which requires fs/path and
 * creates a path-traversal attack surface), we store the entire service-account
 * JSON as a single environment variable: GOOGLE_SERVICE_ACCOUNT_JSON.
 *
 * How to set it in .env.local:
 *   GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"-----BEGIN...","client_email":"...@....iam.gserviceaccount.com",...}'
 *
 * On Vercel / Railway / Render: paste the same one-line JSON in the env var UI.
 * The private_key newlines must be literal \n inside the JSON string (standard JSON format).
 */
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Cache the OAuth2 access token in RAM to avoid a round-trip on every request.
// The token is valid for 1 hour; we refresh it 60 seconds early to avoid edge-case
// expiry during a long request.
let cachedToken: { value: string; expiresAt: number } | null = null;

interface TTSRequest {
    text?: string;   // Plain text input (existing — used by DeckStudySession).
    ssml?: string;   // SSML markup input (new — used by GeneralChat for multilingual audio).
    languageCode: string;
    voiceName?: string;
    ssmlGender?: string;
    pitch?: number;
    speakingRate?: number;
    volumeGainDb?: number;
}

// ─── CREDENTIALS LOADER ───────────────────────────────────────────────────────

/**
 * loadCredentials — reads the Google service-account JSON from the environment.
 *
 * Why an env var instead of a file?
 * Files on disk introduce a path-traversal surface: if GOOGLE_APPLICATION_CREDENTIALS
 * is compromised in CI/CD, an attacker can redirect it to any file on the system.
 * An env var containing the JSON directly has no file-system dependency at all.
 *
 * @throws if GOOGLE_SERVICE_ACCOUNT_JSON is missing or not valid JSON.
 */
function loadCredentials(): {
  client_email: string;
  private_key: string;
  token_uri: string;
} {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON env var is not set. ' +
      'Paste the service-account JSON as a single-line string in .env.local.'
    );
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON. ' +
      'Make sure the value is a single-line JSON string with no trailing newline.'
    );
  }
}

// ─── TOKEN GENERATION ─────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Return the cached token if it's still valid (with a 60-second buffer).
  if (cachedToken && now < cachedToken.expiresAt - 60) {
    return cachedToken.value;
  }

  // Load credentials from the environment — no file I/O.
  const creds = loadCredentials();

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

  // Import the RSA private key for JWT signing.
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

  // Exchange the JWT for a short-lived OAuth2 access token.
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

        if ((!body.text && !body.ssml) || !body.languageCode) {
            return NextResponse.json(
                { error: 'Missing required fields: (text or ssml) and languageCode' },
                { status: 400 }
            );
        }

        // Enforce length limits on whichever input format is used.
        // SSML includes markup, so its raw length is higher than plain text.
        const inputLength = body.ssml?.length ?? body.text?.length ?? 0;
        if (inputLength > 5000) {
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
            // Use SSML input when provided (multilingual), plain text otherwise.
            // SSML enables <lang> tags for per-segment phoneme switching.
            input: body.ssml ? { ssml: body.ssml } : { text: body.text! },
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