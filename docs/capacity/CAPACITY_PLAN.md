# Capacity Plan

> **bozza informativa — non consulenza legale/tecnica definitiva**

## Executive Summary

LingoCoon è una piattaforma di language learning con componenti AI (TTS, STT, LLM), spaced repetition (FSRS), e real-time features. Questo documento stima i requisiti di capacità per i prossimi 12-18 mesi e definisce i trigger di scaling.

---

## Baseline Attuale (Ottobre 2026)

| Componente | Configurazione | Utilizzo Attuale | Capacità Residua |
|------------|----------------|------------------|------------------|
| **Vercel Functions (Fluid Compute)** | Default, 300s timeout, 1024MB | ~50 invocazioni/min (picco) | >90% |
| **Supabase PostgreSQL** | Shared instance (starter) | ~500 connessioni/giorno | ~80% |
| **Supabase Auth** | Managed | ~100 MAU | N/A |
| **Supabase Storage** | Blob (Vercel) | < 1 GB | >95% |
| **Google Cloud TTS (Chirp 3 HD)** | Pay-as-you-go | ~10k caratteri/giorno | Budget: 1M/mese |
| **Google Gemini API** | Pay-as-you-go | ~500 richieste/giorno | Quota: 1500/min |
| **Sentry** | Team plan | ~1k eventi/giorno | Quota: 100k/mese |
| **Vercel Web Analytics** | Included | ~2k pageviews/giorno | Unlimited |

---

## Carico di Lavoro Principali

### 1. API Routes (Next.js App Router)

| Endpoint | Frequenza | P95 Latency | Risorse Critiche |
|----------|-----------|-------------|------------------|
| `GET /api/decks` | 200/min | 120ms | DB read (decks + cards) |
| `POST /api/decks` | 20/min | 180ms | DB write (deck + cards) |
| `GET /api/study/next` | 500/min | 90ms | DB read (study_progress + cards) |
| `POST /api/study/review` | 500/min | 150ms | DB write (study_progress upsert) |
| `POST /api/tts/generate` | 50/min | 2.5s | Google TTS API, Blob write |
| `GET /api/tts/audio/[hash]` | 200/min | 50ms | Blob read (CDN cached) |
| `POST /api/ai/chat` | 30/min | 3.5s | Gemini API, prompt tokens |
| `POST /api/stt/transcribe` | 10/min | 4.0s | STT endpoint, audio upload |
| `GET /api/health` | 60/min | 30ms | DB ping, external checks |

### 2. Database Query Patterns

| Query | Frequenza | Indici Usati | Note |
|-------|-----------|--------------|------|
| `get_deck_stats(deck_uuid)` | 200/min | `idx_cards_deck_id`, `idx_study_progress_user_next_review` | SECURITY DEFINER, ownership check |
| `SELECT * FROM study_progress WHERE user_id = ? AND next_review_date <= now()` | 500/min | `idx_study_progress_user_next_review` | Core spaced repetition |
| `UPSERT study_progress` | 500/min | PK `(user_id, card_id)` | `ON CONFLICT` |
| `SELECT * FROM cards WHERE deck_id = ?` | 200/min | `idx_cards_deck_id` | Deck browsing |
| `SELECT * FROM decks WHERE user_id = ?` | 100/min | `idx_decks_user_id` | Dashboard |

### 3. External API Dependencies

| Provider | Endpoint | Quota/Rate Limit | Costo Unitario | Fallback |
|----------|----------|------------------|----------------|----------|
| Google Cloud TTS | `text:synthesize` | 1M char/mese free, poi $16/M char | $16/M char | Cache hit (80% target) |
| Google Gemini | `generateContent` | 1500 RPM, 1M token/min | $0.35/1M input, $1.05/1M output | Retry + exponential backoff |
| STT Endpoint | `/transcribe` | Configurabile | Per provider | Queue + retry |

---

## Proiezione Crescita (12 Mesi)

| Metrica | Mese 0 | Mese 3 | Mese 6 | Mese 12 | Driver |
|---------|--------|--------|--------|---------|--------|
| **MAU** | 100 | 500 | 2,000 | 10,000 | Marketing, word-of-mouth, SEO |
| **API req/min (picco)** | 50 | 250 | 1,000 | 5,000 | MAU × sessioni/giorno × actions/sessione |
| **TTS caratteri/giorno** | 10k | 50k | 200k | 1M | Feature adoption, new voices |
| **AI chat richieste/giorno** | 500 | 2,500 | 10k | 50k | AI study mode launch |
| **STT richieste/giorno** | 100 | 500 | 2,000 | 10k | Speaking practice launch |
| **DB size (GB)** | 0.5 | 2 | 10 | 50 | User content + progress history |
| **Blob storage (GB)** | 0.1 | 1 | 5 | 30 | TTS audio cache |

---

## Soglie di Scaling (Trigger)

### Vercel Functions (Fluid Compute)

| Metrica | Warning | Critical | Azione |
|---------|---------|----------|--------|
| **Invocazioni/min (sustained)** | > 1,000 | > 5,000 | Upgrade plan, ottimizza cold starts |
| **P95 latency** | > 2s | > 5s | Profile, ottimizza query, caching |
| **Error rate (5xx)** | > 1% | > 5% | Alert on-call, rollback deploy |
| **Memory usage** | > 700MB | > 900MB | Aumenta memory limit, fix leaks |
| **Execution time** | > 120s | > 240s | Ottimizza, spezza in job async |

### Supabase PostgreSQL

| Metrica | Warning | Critical | Azione |
|---------|---------|----------|--------|
| **Connessioni attive** | > 80% max | > 95% max | PgBouncer, connection pooling |
| **CPU utilization** | > 70% | > 90% | Upgrade instance, read replicas |
| **Disk usage** | > 70% | > 85% | Cleanup, partition, upgrade storage |
| **Query P95** | > 500ms | > 2s | Indici, query rewrite, caching |
| **Replication lag** | > 1s | > 10s | Investiga, reduce write load |

### Google Cloud TTS

| Metrica | Warning | Critical | Azione |
|---------|---------|----------|--------|
| **Caratteri/giorno** | > 500k | > 900k | Aumenta budget, ottimizza cache |
| **Cache hit rate** | < 70% | < 50% | Aumenta TTL, pre-warm cache |
| **Error rate** | > 2% | > 5% | Circuit breaker, fallback voice |
| **Latency P95** | > 3s | > 5s | Regional endpoint, streaming |

### Google Gemini

| Metrica | Warning | Critical | Azione |
|---------|---------|----------|--------|
| **RPM usage** | > 1,000 | > 1,400 | Request quota increase, batch requests |
| **Token/min** | > 500k | > 900k | Ottimizza prompt, caching risposte |
| **Error rate** | > 3% | > 8% | Retry logic, fallback model |
| **Costo/giorno** | > $10 | > $50 | Budget alert, rate limiting utenti |

---

## Architettura di Scaling

### Livello 1: Ottimizzazioni Applicative (0-6 mesi)

```typescript
// 1. Caching aggressivo TTS (già implementato)
// reading_tts_cache: text_hash + voice + language + speed → audio_url
// TTL: 30 giorni, target hit rate > 80%

// 2. Database connection pooling (PgBouncer via Supabase)
// Config: pool_mode = transaction, max_client_conn = 100, default_pool_size = 20

// 3. Query optimization
// - get_deck_stats: single query con LEFT JOIN (già ottimizzato)
// - study_progress: composite index (user_id, next_review_date)
// - cards: deck_id index + partial indexes per difficulty

// 4. Edge caching (Vercel)
// - Static assets: immutable, 1 year
// - API responses: stale-while-revalidate per GET idempotenti
// - TTS audio: CDN cached, Cache-Control: public, max-age=31536000, immutable

// 5. Rate limiting per utente
// - TTS: 100 caratteri/min, 1000/giorno (budget enforced)
// - AI chat: 20 richieste/min, 200/giorno
// - STT: 10 richieste/min, 50/giorno
```

### Livello 2: Infrastructure Scaling (6-12 mesi)

| Componente | Scaling Verticale | Scaling Orizzontale |
|------------|-------------------|---------------------|
| **Vercel Functions** | Aumenta memory (1024→2048→4096MB), timeout | Fluid Compute auto-scales; Rolling Releases per deploy sicuri |
| **Supabase DB** | Upgrade instance (Shared → Pro → Dedicated) | Read replicas (max 5), PgBouncer, partitioning per `user_id` |
| **Supabase Auth** | Managed (auto-scale) | N/A |
| **Blob Storage** | Auto (Vercel Blob) | Multi-region replication |
| **Google TTS** | Budget increase | Regional endpoints (eu-west1, us-central1) |
| **Gemini** | Quota increase request | N/A (API managed) |
| **Sentry** | Plan upgrade (Team → Business) | N/A |

### Livello 3: Architettura Distribuita (12+ mesi)

- **Microservizi**: Estrazione TTS/STT/AI in servizi dedicati (Vercel Functions o Cloud Run)
- **Message Queue**: Vercel Queues per job async (TTS generation, AI batch, analytics)
- **Caching Layer**: Redis (Upstash/Vercel KV) per sessioni, rate limits, feature flags
- **Database Sharding**: Per `user_id` hash su multiple DB instance
- **Multi-region**: Deploy attivo-attivo EU + US per latency < 100ms global

---

## Budget Stima (USD/mese)

| Componente | Mese 0 | Mese 3 | Mese 6 | Mese 12 | Note |
|------------|--------|--------|--------|---------|------|
| **Vercel (Pro)** | $20 | $20 | $50 | $150 | Fluid Compute, Analytics, Blob |
| **Supabase (Pro)** | $25 | $25 | $100 | $500 | DB, Auth, Storage, Realtime |
| **Google Cloud TTS** | $0 | $5 | $20 | $160 | 1M char = $16 |
| **Google Gemini** | $0 | $2 | $15 | $100 | Token-based |
| **STT Endpoint** | $0 | $10 | $50 | $200 | Provider dipendente |
| **Sentry (Team)** | $26 | $26 | $80 | $200 | Eventi + Replay |
| **Totale Stimato** | **~$71** | **~$88** | **~$315** | **~$1,310** | +20% buffer |

---

## Risk Register

| Rischio | Probabilità | Impatto | Mitigazione | Trigger Monitoraggio |
|---------|-------------|---------|-------------|---------------------|
| **TTS budget overrun** | Media | Alto (costi imprevisti) | Hard limits per utente/giorno, alert 80% budget | Daily budget check |
| **Gemini quota exceeded** | Media | Alto (feature down) | Request quota increase proattivo, circuit breaker | RPM > 1000 sustained |
| **DB connection exhaustion** | Bassa | Critico (outage) | PgBouncer, connection pooling, read replicas | Connections > 80% max |
| **Vercel function timeout** | Bassa | Medio (errori 5xx) | Async job per operazioni lunghe, streaming | P95 > 120s |
| **Blob storage cost spike** | Bassa | Medio | Lifecycle policy, compressione, cleanup job | Storage > 50GB |
| **Supabase disk full** | Bassa | Critico | Monitoring, auto-vacuum, partitioning | Disk > 70% |
| **STT provider outage** | Bassa | Medio (feature down) | Multi-provider fallback, queue + retry | Health check fail |
| **Sentry event spike** | Media | Basso (costi) | Sample rate dinamico, alert su spike | Events > 50k/giorno |

---

## Runbook Scaling (Quick Reference)

### Scale Up Vercel (Immediato)
1. Vercel Dashboard → Project → Settings → Functions → Increase memory/timeout
2. `vercel.ts`: aggiorna `resourceConfig.functionDefaultMemoryType`
3. Deploy preview → test → promote

### Scale Up Supabase (Poche ore)
1. Supabase Dashboard → Settings → Database → Upgrade instance
2. Abilita Read Replicas se read-heavy
3. Configura PgBouncer: `pool_mode=transaction`, `max_client_conn=200`

### TTS Budget Emergency
1. Vercel Dashboard → Edge Config / Global Config → `tts_daily_limit_per_user` ↓
2. Disabilita voci premium: `voice_tier = 'standard'` in budget periods
3. Aumenta cache TTL: `expires_at = now() + interval '60 days'`

### DB Query Performance Emergency
1. `EXPLAIN ANALYZE` query lente
2. Aggiungi indici mancanti (online, `CONCURRENTLY`)
3. `SET enable_seqscan = off;` per sessione
4. Se critico: read replica per SELECT, primary per WRITE

---

## Metriche Chiave da Dashboard (Grafana/Datadog/Vercel)

| Dashboard | Metriche | Refresh |
|-----------|----------|---------|
| **API Health** | req/min, P50/P95/P99 latency, error rate, 5xx rate | 30s |
| **Database** | connections, CPU, disk, query latency, replication lag | 1min |
| **External APIs** | quota usage, latency, error rate, cost/day | 5min |
| **Business** | MAU, DAU, sessioni/giorno, reviews/giorno, TTS chars/giorno | 1h |
| **Cost** | Spend per provider, projected monthly, budget % | 1h |

---

## Changelog

| Data | Versione | Modifiche | Autore |
|------|----------|-----------|--------|
| 2026-10-26 | 1.0 | Creazione iniziale | Claude Code |