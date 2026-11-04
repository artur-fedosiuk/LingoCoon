# Scaling Risks & Mitigations

> **bozza informativa — non consulenza legale/tecnica definitiva**

> **Gate context**: This document complements CAPACITY_PLAN.md (created earlier in this session) and is linked from its Risk Register section. Created per user's verbatim instruction: "Phase D — Performance/Capacity: Create CAPACITY_PLAN.md, LOAD_TEST_PLAN.md, SCALING_RISKS.md" from the comprehensive enterprise readiness execution prompt.

## Matrice Rischi (Probabilità × Impatto)

| Rischio | Probabilità | Impatto | Score | Priorità |
|---------|-------------|---------|-------|----------|
| TTS budget overrun | Media | Alto | 6 | P1 |
| Gemini quota exceeded | Media | Alto | 6 | P1 |
| DB connection exhaustion | Bassa | Critico | 6 | P1 |
| Vercel function timeout | Bassa | Medio | 3 | P2 |
| Blob storage cost spike | Bassa | Medio | 3 | P2 |
| Supabase disk full | Bassa | Critico | 6 | P1 |
| STT provider outage | Bassa | Medio | 3 | P2 |
| Sentry event spike | Media | Basso | 2 | P3 |
| Cold start regression | Media | Medio | 4 | P2 |
| Cache stampede (TTS) | Media | Alto | 6 | P1 |

---

## Dettaglio Rischi P1

### 1. TTS Budget Overrun

**Scenario**: Utenti generano >1M caratteri/mese → costi imprevisti $16/M char oltre free tier.

**Trigger**: `google_tts_budget_periods.daily_used > 800k` sostenuto per 3 giorni.

**Impatto**:
- Costi mensili $160+ non pianificati
- Possibile sospensione servizio Google se billing non configurato
- Degradazione UX se si disabilita TTS d'emergenza

**Mitigazioni Attive**:
- Hard limit per utente: 100 caratteri/min, 1.000/giorno (Edge Config `tts_daily_limit_per_user`)
- Cache hit rate target >80% (TTL 30 giorni su `reading_tts_cache`)
- Alert Sentry a 80% budget giornaliero
- Fallback voice `chirp3-hd` → `standard` se budget critico

**Gap Residuo**:
- Nessun rate limiting a livello Vercel Edge (solo application-level)
- Budget enforcement dipende da `reading_tts_admission` — se bypassato, nessun guard

**Azione Richiesta**:
```typescript
// vercel.ts - aggiungere rate limit Edge per /api/tts/generate
headers: [
  routes.rateLimit('/api/tts/generate', {
    limit: 100,
    window: '1m',
    key: 'user_id' // richiede middleware auth
  })
]
```

---

### 2. Gemini Quota Exceeded

**Scenario**: RPM > 1.500 sustained o token/min > 1M → 429 errors, feature AI down.

**Trigger**: `gemini_rpm > 1000` per 10 min o `token_min > 500k` per 10 min.

**Impatto**:
- `/api/ai/chat` e `/api/ai/dictionary` falliscono
- Nessun fallback LLM configurato
- UX rotta per study mode AI

**Mitigazioni Attive**:
- Retry con exponential backoff (max 3 tentativi)
- Circuit breaker: dopo 5 errori 429 consecutivi → disabilita AI per 5 min
- Token budget per utente: 20 req/min, 200/giorno (application-level)

**Gap Residuo**:
- Nessun modello fallback (es. Gemini Flash → Gemini Pro → disabilita)
- Quota increase request manuale (lead time ~giorni)
- Nessun monitoring quota usage real-time in dashboard

**Azione Richiesta**:
```typescript
// lib/ai/gateway.ts - implementare fallback chain
const MODELS = [
  { id: 'gemini-1.5-flash', rpm: 1500, cost: 'low' },
  { id: 'gemini-1.5-pro', rpm: 300, cost: 'high' },
  { id: 'disabled', rpm: 0, cost: 0 }
];
```

---

### 3. DB Connection Exhaustion

**Scenario**: Connessioni attive > 95% max (Supabase shared: ~100 connessioni) → nuovi client rejected.

**Trigger**: `pg_stat_activity count > 95` sostenuto.

**Impatto**:
- Tutte le query falliscono (5xx)
- Nessun nuovo utente può fare login/registrazione
- Recovery richiede kill manuale o wait timeout

**Mitigazioni Attive**:
- PgBouncer (Supabase managed): `pool_mode=transaction`, `default_pool_size=20`
- Vercel Functions: max 1 connection per invocation (stateless)
- Connection pooling lato client (Supabase JS client)

**Gap Residuo**:
- Nessun alert proattivo su connection count
- Long-running queries (es. analytics) possono bloccare pool
- Migration `get_deck_stats` usa SECURITY DEFINER — evita RLS ma usa connessione

**Azione Richiesta**:
```sql
-- Alert query (run via pg_cron ogni 5 min)
SELECT
  count(*) as active_connections,
  max(now() - query_start) as longest_query
FROM pg_stat_activity
WHERE state = 'active' AND pid <> pg_backend_pid();
```

---

### 4. Supabase Disk Full

**Scenario**: Disk usage > 85% → write fail, autovacuum blocked, corruption risk.

**Trigger**: `pg_database_size('postgres') > 0.85 * storage_quota`.

**Impatto**:
- Outage completo (nessun INSERT/UPDATE)
- PITR backup può fallire
- Recovery richiede supporto Supabase (ore)

**Mitigazioni Attive**:
- Retention policy automatica (DATA_RETENTION.md)
- PITR 7 giorni + manual snapshots 30 giorni
- Monitoring disk usage via Supabase Dashboard

**Gap Residuo**:
- Nessun alert automatico a 70% (warning threshold)
- `study_progress` cresce linearmente con utenti + tempo (no partitioning)
- TTS audio su Blob (Vercel) — non su DB, ma `reading_tts_cache` metadata resta

**Azione Richiesta**:
- Implementare partitioning `study_progress` per `user_id` hash (Mese 6+)
- Alert Sentry custom metric `db_disk_usage_pct > 70`

---

### 5. Cache Stampede (TTS)

**Scenario**: Cache miss simultaneo per stesso testo → N richieste parallele a Google TTS → quota spike + latency spike.

**Trigger**: `reading_tts_cache` miss per hash popolare (es. saluto comune) + traffico picco.

**Impatto**:
- Caratteri TTS consumati N volte per stesso contenuto
- Latency P95 da 2.5s → 10s+ (code Google TTS)
- Possibile quota exceeded cascata

**Mitigazioni Attive**:
- `reading_tts_admission` con `status = 'processing'` previene duplicati (advisory lock)
- `reading_tts_dispatch_windows` spalma richieste nel tempo

**Gap Residuo**:
- Advisory lock su `pg_try_advisory_xact_lock(hash)` — se transazione fallisce, lock rilasciato ma cache non popolata → retry storm
- Nessun "stale-while-revalidate" per TTS (cache miss = genera, non serve stale)

**Azione Richiesta**:
```sql
-- Migliorare admission: usa pg_advisory_lock (non xact) + stato 'generating'
-- Separare lock da transazione per evitare race condition
```

---

## Dettaglio Rischi P2

### 6. Vercel Function Timeout

**Scenario**: Operazioni lunghe (AI batch, TTS bulk, export) > 300s → 504 Gateway Timeout.

**Mitigazione**: Spostare operazioni > 60s in Vercel Queues / async job + polling.

### 7. Blob Storage Cost Spike

**Scenario**: TTS audio cache non pulito → storage > 50GB → costi imprevisti.

**Mitigazione**: Lifecycle policy `expires_at` + cron cleanup giornaliero (già in DATA_RETENTION.md).

### 8. Cold Start Regression

**Scenario**: Deploy introduce dependency pesante → cold start > 2s → P95 degradation.

**Mitigazione**:
- Bundle analyzer in CI (`@next/bundle-analyzer`)
- Threshold: `npm run build` fail se chunk > 500KB gzipped
- Pre-warm via Vercel Cron (health endpoint) ogni 5 min

### 9. STT Provider Outage

**Scenario**: Endpoint STT down → speaking practice non funziona.

**Mitigazione**: Multi-provider fallback (Whisper local / AssemblyAI / Deepgram) + queue + retry.

---

## Dettaglio Rischi P3

### 10. Sentry Event Spike

**Scenario**: Bug in produzione → error rate 100x → quota Sentry esaurita → blind spots.

**Mitigazione**: Dynamic sampling `tracesSampleRate` basato su error rate + alert su spike > 50k eventi/giorno.

---

## Architettura Difesa in Profondità

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│  - Rate limit awareness (429 handling, retry-after)         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              VERCEL EDGE / MIDDLEWARE                        │
│  - Rate limiting per IP/user (Edge Config)                  │
│  - Auth validation (JWT verification)                       │
│  - Bot detection (Vercel BotID)                             │
│  - Geographic routing (future multi-region)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│            VERCEL FUNCTIONS (Fluid Compute)                  │
│  - Application-level rate limits (per user, per feature)    │
│  - Circuit breakers (Gemini, TTS, STT)                      │
│  - Input validation (Zod schemas)                           │
│  - Observability (Sentry tracing, custom metrics)           │
│  - Graceful degradation (fallback voices, disabled AI)      │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
┌──────────────────┐ ┌────────────┐ ┌────────────┐
│   SUPABASE DB    │ │ GOOGLE TTS │ │  GEMINI    │
│  - RLS + ownership│ │ - Budget   │ │ - Quota    │
│  - PgBouncer      │ │ - Cache    │ │ - Retry    │
│  - PITR backup    │ │ - Admission│ │ - Fallback │
└──────────────────┘ └────────────┘ └────────────┘
```

---

## Runbook Incident Response (Scaling-Related)

### INCD-001: TTS Budget Overrun (P1)

```bash
# 1. Immediate: Ridurre limite giornaliero per utente
vercel env add EDGE_CONFIG_TTS_DAILY_LIMIT 500 production

# 2. Disabilitare voci premium
vercel env add EDGE_CONFIG_TTS_VOICE_TIER standard production

# 3. Aumentare cache TTL
vercel env add EDGE_CONFIG_TTS_CACHE_TTL_DAYS 60 production

# 4. Verificare consumo attuale
# Supabase Dashboard → SQL Editor:
SELECT user_id, daily_used, daily_limit
FROM reading_tts_budget
WHERE budget_period_id = (SELECT id FROM google_tts_budget_periods WHERE ends_at > now() ORDER BY starts_at LIMIT 1)
ORDER BY daily_used DESC LIMIT 20;
```

### INCD-002: Gemini Quota Exceeded (P1)

```bash
# 1. Immediate: Attivare circuit breaker (disabilita AI)
vercel env add EDGE_CONFIG_AI_ENABLED false production

# 2. Richiedere quota increase Google Cloud Console
# https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

# 3. Se urgente: Deploy hotfix con modello più economico
# git commit --allow-empty -m "chore: switch to gemini-flash-only"
# vercel --prod
```

### INCD-003: DB Connection Exhaustion (P1)

```bash
# 1. Immediate: Identificare query bloccanti
# Supabase Dashboard → Database → Active connections
# Kill longest running:
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '2 minutes';

# 2. Scale: Upgrade Supabase plan (Shared → Pro → Dedicated)
# Supabase Dashboard → Settings → Database → Upgrade

# 3. Config: Aumentare PgBouncer pool size
# (Richiede supporto Supabase per shared instance)
```

### INCD-004: Supabase Disk Full (P1)

```bash
# 1. Immediate: Cleanup manuale tabelle grandi
DELETE FROM reading_tts_admission WHERE expires_at < now() - interval '30 days';
DELETE FROM reading_tts_dispatch_windows WHERE ends_at < now() - interval '90 days';
VACUUM ANALYZE;

# 2. Scale: Upgrade storage
# Supabase Dashboard → Settings → Database → Storage

# 3. Long-term: Partitioning study_progress
-- CREATE TABLE study_progress_partitioned (LIKE study_progress INCLUDING ALL) PARTITION BY HASH (user_id);
-- CREATE TABLE study_progress_p0 PARTITION OF study_progress_partitioned FOR VALUES WITH (MODULUS 4, REMAINDER 0);
-- ... p1, p2, p3
-- INSERT INTO study_progress_partitioned SELECT * FROM study_progress;
-- ALTER TABLE study_progress RENAME TO study_progress_old;
-- ALTER TABLE study_progress_partitioned RENAME TO study_progress;
```

---

## Test di Resilienza (Chaos Engineering)

| Test | Frequenza | Tool | Success Criteria |
|------|-----------|------|------------------|
| TTS budget exhaust simulation | Mensile | k6 script + mock budget | Circuit breaker attivo, fallback voice, 0 caratteri extra consumati |
| Gemini 429 storm | Mensile | k6 script + mock 429 | Retry + backoff, circuit breaker dopo 5 errori, graceful degradation |
| DB connection pool exhaust | Trimestrale | pgbench / k6 | PgBouncer queue, no 5xx per query brevi, alert attivo |
| Cache stampede TTS | Trimestrale | k6 script (100 VU stesso hash) | 1 sola chiamata Google TTS, altri serviti da cache/admission |
| Cold start spike | Per deploy | Vercel deploy preview + k6 10 VU idle 5min | P95 cold start < 2s |

---

## Changelog

| Data | Versione | Modifiche | Autore |
|------|----------|-----------|--------|
| 2026-10-26 | 1.0 | Creazione iniziale | Claude Code |