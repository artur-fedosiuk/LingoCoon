# Load Test Plan

> **bozza informativa — non consulenza legale/tecnica definitiva**

## Obiettivi

1. **Validare capacità attuale** — confermare che baseline regge carico previsto
2. **Identificare breaking points** — trovare soglie dove latency/error rate degradano
3. **Calibrare auto-scaling** — verificare che Vercel Fluid Compute e Supabase scalano correttamente
4. **Regression baseline** — riferimento per confrontare future release
5. **Cost projection** — misurare costo per 1k utenti attivi

---

## Scope

### In Scope
- API routes critiche: `/api/decks`, `/api/study/next`, `/api/study/review`, `/api/tts/generate`, `/api/ai/chat`, `/api/health`
- Database queries: `get_deck_stats`, study_progress read/write, cards/deck listing
- External API integration: Google TTS, Gemini, STT endpoint
- Vercel Functions cold/warm start behavior
- Supabase connection pooling under load

### Out of Scope
- Frontend rendering performance (Core Web Vitals — separato)
- Static asset delivery (CDN — assumed unlimited)
- Auth flow (Supabase managed — load tested separately)
- WebSocket/Realtime (non implementato)

---

## Metodologia

### Tooling
- **k6** (primary) — scriptable, CI-friendly, Vercel/Supabase compatible
- **Vercel Analytics** — correlate business metrics durante test
- **Sentry** — monitor error rate e latency real-time
- **Supabase Dashboard** — monitor DB metrics durante test

### Ambienti
| Ambiente | Scopo | Dati | Isolamento |
|----------|-------|------|------------|
| **Local/Preview** | Sviluppo script, smoke test | Synthetic (10 utenti) | Full isolation |
| **Staging (Vercel Preview)** | Integration test, baseline | Synthetic (100 utenti) | Branch deploy, DB separato |
| **Production-like (dedicato)** | Full load test | Realistic (1k-10k utenti) | Dedicated Supabase project, Vercel project |

### Tipi di Test

| Tipo | Durata | VUs | Obiettivo |
|------|--------|-----|-----------|
| **Smoke** | 2 min | 5 | Verifica script funziona, no errori 5xx |
| **Baseline** | 10 min | 50 | Misura performance normale |
| **Load** | 30 min | 200 | Carico previsto produzione (Mese 6) |
| **Stress** | 20 min | Ramp to 1000 | Trova breaking point |
| **Soak** | 2 h | 300 | Stabilità prolungata, memory leaks |
| **Spike** | 5 min | 0 → 500 → 0 | Reazione a picco improvviso |
| **Cold Start** | 10 min | 10 (idle 5 min) | Misura cold start Vercel Functions |

---

## Scenari di Test

### Scenario 1: Studio Session (Core User Journey)

```javascript
// k6 script: study-session.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Warm up
    { duration: '10m', target: 100 }, // Sustained load
    { duration: '2m', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],      // 95% < 500ms
    http_req_failed: ['rate<0.01'],        // < 1% error rate
    errors: ['rate<0.05'],                 // Custom error rate < 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://lingocoon-staging.vercel.app';
const AUTH_TOKEN = __ENV.AUTH_TOKEN; // Pre-generated per VU

function authHeaders() {
  return {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export default function () {
  // 1. Get user decks (dashboard load)
  let res = http.get(`${BASE_URL}/api/decks`, { headers: authHeaders() });
  check(res, { 'decks: status 200': (r) => r.status === 200 });
  errorRate.add(res.status !== 200);
  sleep(1);

  // 2. Pick first deck, get stats
  if (res.status === 200) {
    const decks = res.json();
    if (decks.length > 0) {
      const deckId = decks[0].id;
      res = http.get(`${BASE_URL}/api/decks/${deckId}/stats`, { headers: authHeaders() });
      check(res, { 'deck_stats: status 200': (r) => r.status === 200 });
      errorRate.add(res.status !== 200);
      sleep(0.5);
    }
  }

  // 3. Get next card for review (core spaced repetition)
  res = http.get(`${BASE_URL}/api/study/next`, { headers: authHeaders() });
  check(res, { 'study_next: status 200': (r) => r.status === 200 });
  errorRate.add(res.status !== 200);

  if (res.status === 200) {
    const card = res.json();
    if (card && card.id) {
      sleep(2); // Simulate user reading card

      // 4. Submit review (quality rating 0-5)
      const quality = Math.floor(Math.random() * 6);
      res = http.post(`${BASE_URL}/api/study/review`, JSON.stringify({
        card_id: card.id,
        quality_rating: quality,
      }), { headers: authHeaders() });
      check(res, { 'study_review: status 200': (r) => r.status === 200 });
      errorRate.add(res.status !== 200);
      sleep(1);
    }
  }

  // 5. TTS generation (10% probability)
  if (Math.random() < 0.1) {
    res = http.post(`${BASE_URL}/api/tts/generate`, JSON.stringify({
      text: 'Hello, how are you?',
      voice_id: 'chirp3-hd-en-US',
      language_code: 'en-US',
      speed: 1.0,
    }), { headers: authHeaders() });
    check(res, { 'tts_generate: status 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    sleep(1);
  }
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}
```

### Scenario 2: AI Chat Session

```javascript
// k6 script: ai-chat.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 5 },
    { duration: '5m', target: 20 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<8000'],  // AI calls slower
    http_req_failed: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://lingocoon-staging.vercel.app';
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

export default function () {
  const res = http.post(`${BASE_URL}/api/ai/chat`, JSON.stringify({
    messages: [
      { role: 'system', content: 'You are a language tutor.' },
      { role: 'user', content: 'Come si dice "buongiorno" in inglese?' },
    ],
    temperature: 0.7,
    max_tokens: 500,
  }), {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    timeout: '30s', // AI can be slow
  });

  check(res, {
    'ai_chat: status 200': (r) => r.status === 200,
    'ai_chat: has response': (r) => r.json().response !== undefined,
  });
  sleep(5); // User reads response
}
```

### Scenario 3: TTS Heavy Load

```javascript
// k6 script: tts-heavy.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '5m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],  // TTS includes external API
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://lingocoon-staging.vercel.app';
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

const TEXTS = [
  'Buongiorno, come stai?',
  'Vorrei imparare l\'italiano.',
  'Questa è una frase di prova per la sintesi vocale.',
  'Il tempo oggi è molto bello.',
  'Grazie per il tuo aiuto.',
];

export default function () {
  const text = TEXTS[Math.floor(Math.random() * TEXTS.length)];
  const res = http.post(`${BASE_URL}/api/tts/generate`, JSON.stringify({
    text,
    voice_id: 'chirp3-hd-it-IT',
    language_code: 'it-IT',
    speed: 1.0,
  }), {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    timeout: '30s',
  });

  check(res, { 'tts: status 200': (r) => r.status === 200 });
}
```

### Scenario 4: Health Endpoint (Observability)

```javascript
// k6 script: health-check.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<100'],   // Health must be fast
    http_req_failed: ['rate<0.001'],    // Near-zero errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://lingocoon-staging.vercel.app';

export default function () {
  const res = http.get(`${BASE_URL}/api/health`, { timeout: '5s' });
  check(res, {
    'health: status 200': (r) => r.status === 200,
    'health: has checks': (r) => r.json().checks !== undefined,
    'health: no-store header': (r) => r.headers['Cache-Control'] === 'no-store',
  });
}
```

---

## Data Preparation

### Synthetic Data Generation (per test DB)

```sql
-- 1. Create test users (1000)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
SELECT
  gen_random_uuid(),
  'loadtest_' || gs || '@example.com',
  crypt('password', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "Load Test User ' || gs || '"}'::jsonb
FROM generate_series(1, 1000) gs;

-- 2. Create profiles
INSERT INTO public.profiles (id, email, nickname, native_language, target_language, current_level, onboarding_completed)
SELECT id, email, 'User' || (row_number() over ()), 'en', 'it', 'beginner', true
FROM auth.users WHERE email LIKE 'loadtest_%';

-- 3. Create decks per user (3-5 each)
INSERT INTO public.decks (user_id, title, description, language_from, language_to)
SELECT
  p.id,
  'Deck ' || d.num,
  'Load test deck',
  'en', 'it'
FROM public.profiles p
CROSS JOIN LATERAL generate_series(1, 3 + (random() * 2)::int) d(num);

-- 4. Create cards per deck (20-50 each)
INSERT INTO public.cards (deck_id, front, back, example_sentence, difficulty)
SELECT
  d.id,
  'Word ' || c.num,
  'Parola ' || c.num,
  'Example sentence ' || c.num,
  (random() * 5)::int
FROM public.decks d
CROSS JOIN LATERAL generate_series(1, 20 + (random() * 30)::int) c(num);

-- 5. Create study_progress (some reviewed, some due)
INSERT INTO public.study_progress (user_id, card_id, last_reviewed_at, quality_rating, ease_factor, interval, repetitions, next_review_date)
SELECT
  c.deck_id, -- user_id via deck
  c.id,
  CASE WHEN random() < 0.7 THEN now() - (random() * interval '30 days') END,
  CASE WHEN random() < 0.7 THEN (random() * 5)::int + 1 END,
  2.5 + random() * 0.5,
  CASE WHEN random() < 0.7 THEN (1 + random() * 30)::int ELSE 1 END,
  CASE WHEN random() < 0.7 THEN (random() * 10)::int ELSE 0 END,
  now() + (random() * interval '7 days')
FROM public.cards c
JOIN public.decks d ON c.deck_id = d.id
WHERE random() < 0.8; -- 80% of cards have progress
```

---

## Esecuzione Test

### Prerequisiti
```bash
# Install k6
brew install k6  # macOS
# or: sudo apt-get install k6  # Linux

# Set environment variables
export BASE_URL=https://lingocoon-staging.vercel.app
export AUTH_TOKEN=<generate via Supabase Auth admin API per test user>
```

### Run Commands
```bash
# Smoke test (2 min)
k6 run --vus 5 --duration 2m scripts/load/study-session.js

# Baseline (10 min)
k6 run scripts/load/study-session.js

# Load test (30 min)
k6 run --stage 2m:10 --stage 10m:100 --stage 2m:0 scripts/load/study-session.js

# Stress test (ramp to breaking point)
k6 run --stage 1m:50 --stage 5m:200 --stage 5m:500 --stage 5m:1000 --stage 2m:0 scripts/load/study-session.js

# Soak test (2 hours)
k6 run --stage 5m:50 --stage 1h50m:300 --stage 5m:0 scripts/load/study-session.js

# Spike test
k6 run --stage 30s:500 --stage 1m:0 scripts/load/study-session.js

# Cold start test
k6 run --stage 5m:0 --stage 10m:10 scripts/load/study-session.js
```

### CI Integration (GitHub Actions)

```yaml
# .github/workflows/load-test.yml
name: Load Test
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options: [staging, production-like]
      test_type:
        description: 'Test type'
        required: true
        type: choice
        options: [smoke, baseline, load, stress, soak, spike]

jobs:
  load-test:
    runs-on: ubuntu-latest
    timeout-minutes: 180
    steps:
      - uses: actions/checkout@v4
      - name: Setup k6
        uses: grafana/setup-k6-action@v1
      - name: Run load test
        env:
          BASE_URL: ${{ secrets[format('LOAD_TEST_{0}_URL', github.event.inputs.environment)] }}
          AUTH_TOKEN: ${{ secrets[format('LOAD_TEST_{0}_TOKEN', github.event.inputs.environment)] }}
        run: |
          k6 run --out json=results.json scripts/load/${{ github.event.inputs.test_type }}.js
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: load-test-results
          path: results.json
      - name: Check thresholds
        run: |
          # Parse results.json, fail if thresholds exceeded
          node scripts/check-load-thresholds.js results.json
```

---

## Metriche di Successo (Pass/Fail Criteria)

| Test Type | Metrica | Pass Threshold | Fail Action |
|-----------|---------|----------------|-------------|
| **Smoke** | Error rate | < 1% | Fix script/environment |
| **Baseline** | P95 latency (study_next) | < 200ms | Investigate regression |
| **Baseline** | P95 latency (tts_generate) | < 3000ms | Check cache hit rate |
| **Load** | Error rate (all) | < 1% | Scale up / optimize |
| **Load** | P95 latency (study_next) | < 500ms | Add indexes / cache |
| **Load** | P95 latency (tts_generate) | < 5000ms | Increase cache TTL |
| **Stress** | Breaking point VUs | > 500 | Document limit |
| **Soak** | Memory growth | < 10%/hour | Fix memory leak |
| **Soak** | Error rate drift | < 2x baseline | Investigate degradation |
| **Spike** | Recovery time | < 30s | Improve cold start |
| **Cold Start** | First request P95 | < 2s | Pre-warm / optimize init |

---

## Reporting

### Output Artifacts
1. **k6 JSON output** — raw metrics per VU, per endpoint
2. **Summary report** — `k6 run --out json=results.json` + `k6 summary results.json`
3. **Grafana dashboard** — import k6 JSON per visualization
4. **Comparison report** — vs baseline precedente (se esiste)

### Template Report

```markdown
# Load Test Report — {{DATE}} — {{TEST_TYPE}} — {{ENVIRONMENT}}

## Summary
- **Test Type**: {{smoke|baseline|load|stress|soak|spike}}
- **Environment**: {{staging|production-like}}
- **Duration**: {{X}} minutes
- **Peak VUs**: {{N}}
- **Total Requests**: {{N}}
- **Overall Result**: {{PASS|FAIL}}

## Key Metrics

| Endpoint | Req Count | P50 | P95 | P99 | Error Rate | Throughput (req/s) |
|----------|-----------|-----|-----|-----|------------|-------------------|
| GET /api/decks | | | | | | |
| GET /api/study/next | | | | | | |
| POST /api/study/review | | | | | | |
| POST /api/tts/generate | | | | | | |
| POST /api/ai/chat | | | | | | |
| GET /api/health | | | | | | |

## Database Metrics (Supabase)
- Max connections:
- CPU utilization (avg/peak):
- Disk IOPS:
- Query P95 (get_deck_stats):
- Query P95 (study_progress upsert):

## External API Metrics
- Google TTS: calls, P95, error rate, cache hit rate
- Gemini: calls, P95, token usage, error rate
- STT: calls, P95, error rate

## Vercel Functions
- Invocations:
- Cold starts %:
- Avg duration:
- Memory usage (avg/peak):
- Error rate:

## Findings
### Critical
-

### Warning
-

### Info
-

## Recommendations
1.
2.
3.

## Next Test
- Schedule:
- Target:
- Focus:
```

---

## Changelog

| Data | Versione | Modifiche | Autore |
|------|----------|-----------|--------|
| 2026-10-26 | 1.0 | Creazione iniziale | Claude Code |