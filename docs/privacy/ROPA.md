# Record of Processing Activities (ROPA)

> **bozza informativa — non consulenza legale**

## Panoramica

Questo documento registra le attività di trattamento dati di LingoCoon per conformità GDPR Art. 30. Deve essere aggiornato a ogni cambiamento di schema, provider o workflow.

---

## Attività di Trattamento

### 1. Autenticazione e Profili Utente

| Campo | Valore |
|-------|--------|
| **Dati trattati** | `auth.users`: id (uuid), email, created_at, last_sign_in_at, encrypted_password, email_confirmed_at, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data |
| | `public.profiles`: id, email, nickname, native_language, target_language, current_level, learning_purpose, learning_purpose_details, onboarding_completed_at, learning_profile (jsonb), xp, streak, onboarding_completed, created_at, updated_at |
| **Finalità** | Identificare l'utente, personalizzare l'esperienza di apprendimento, gestire sessioni autenticate |
| **Base giuridica** | Art. 6(1)(b) GDPR — esecuzione contratto (servizio richiesto) |
| **Retention** | Account attivo: durata del rapporto. Eliminazione: 30 giorni dopo richiesta cancellazione (Art. 17 GDPR) |
| **Subprocessor** | Supabase (PostgreSQL, Auth, Storage) — EU/US (Standard Contractual Clauses) |
| **Trasferimenti internazionali** | Sì — Supabase usa AWS/GCP; SCC in vigore |
| **Diritti utente** | Accesso (Art. 15), Rettifica (Art. 16), Cancellazione (Art. 17), Limitazione (Art. 18), Portabilità (Art. 20), Opposizione (Art. 21) |
| **Owner** | Team LingoCoon — Privacy Lead |

### 2. Deck e Flashcard (Contenuti Apprendimento)

| Campo | Valore |
|-------|--------|
| **Dati trattati** | `public.decks`: id, user_id, title, description, language_from, language_to, created_at, updated_at |
| | `public.cards`: id, deck_id, front, back, example_sentence, pronunciation, difficulty, created_at, updated_at |
| **Finalità** | Fornire contenuti di apprendimento personalizzati, tracciare progresso per deck |
| **Base giuridica** | Art. 6(1)(b) — esecuzione contratto |
| **Retention** | Finché l'utente mantiene il deck. Eliminazione cascata su cancellazione utente/deck |
| **Subprocessor** | Supabase (PostgreSQL) |
| **Diritti utente** | Accesso, Rettifica, Cancellazione, Portabilità (export JSON) |
| **Owner** | Team LingoCoon — Product Lead |

### 3. Progresso Studio (Spaced Repetition)

| Campo | Valore |
|-------|--------|
| **Dati trattati** | `public.study_progress`: id, user_id, card_id, last_reviewed_at, quality_rating, ease_factor, interval, repetitions, next_review_date, created_at, updated_at |
| **Finalità** | Algoritmo FSRS per scheduling revisioni ottimali, statistiche apprendimento |
| **Base giuridica** | Art. 6(1)(b) — esecuzione contratto; Art. 6(1)(f) — interesse legittimo (miglioramento servizio) |
| **Retention** | Finché utile per scheduling. Anonimizzazione su richiesta cancellazione |
| **Subprocessor** | Supabase (PostgreSQL) |
| **Diritti utente** | Accesso, Cancellazione (include anonimizzazione progressi), Portabilità |
| **Owner** | Team LingoCoon — ML/Algorithm Lead |

### 4. Text-to-Speech (TTS) — Google Chirp 3 HD

| Campo | Valore |
|-------|--------|
| **Dati trattati** | Testo da sintetizzare (invio a Google Cloud TTS), audio restituito (WAV/PCM), metadata: user_id, deck_id, card_id, voice, language, speed, character_count, timestamp, budget_period_id |
| | `public.reading_tts_budget`: lifetime_limit, daily_limit, user_daily_limit, credit_expires_at, lifetime_used |
| | `public.google_tts_budget_periods`: starts_at, ends_at, outside_characters, reserved_characters, reconciled_at, enabled, character_limit, voice_tier |
| | `public.reading_tts_cache`: id, owner_id, text_hash, voice_id, language_code, speed, audio_url, size_bytes, created_at, expires_at |
| | `public.reading_tts_admission`: id, owner_id, text_hash, voice_id, language_code, status, reserved_characters, created_at, expires_at |
| | `public.reading_tts_dispatch_windows`: id, starts_at, ends_at, max_concurrent, reserved_slots |
| **Finalità** | Sintesi vocale per pratica pronuncia, budget/controllo costi, cache per efficienza |
| **Base giuridica** | Art. 6(1)(b) — esecuzione contratto (funzionalità richiesta); Art. 6(1)(f) — interesse legittimo (budget/costi) |
| **Retention** | Audio in cache: 30 giorni (TTL). Budget/accounting: 2 anni per audit. Testo sintesi: non persistito oltre cache |
| **Subprocessor** | Google Cloud (Text-to-Speech API) — EU/US, DPA + SCC |
| **Trasferimenti internazionali** | Sì — Google Cloud; DPA + SCC in vigore |
| **Diritti utente** | Accesso (log utilizzo), Cancellazione (cache audio), Limitazione (disabilita TTS) |
| **Owner** | Team LingoCoon — TTS/Infrastructure Lead |

### 5. Speech-to-Text (STT) — Whisper-compatible

| Campo | Valore |
|-------|--------|
| **Dati trattati** | Audio registrato dal microfono (invio a endpoint STT), trascrizione restituita (testo), metadata: user_id, timestamp, model_id |
| **Finalità** | Input vocale per pratica speaking, trascrizione per feedback |
| **Base giuridica** | Art. 6(1)(b) — esecuzione contratto (funzionalità opzionale, attivata dall'utente) |
| **Retention** | Audio: eliminato subito dopo trascrizione. Trascrizione: usata solo in sessione, non persistita |
| **Subprocessor** | Endpoint Whisper-compatible configurabile (es. OpenAI, self-hosted) — DPA richiesto |
| **Diritti utente** | Accesso, Cancellazione, Opposizione (disabilita microfono) |
| **Owner** | Team LingoCoon — STT/Infrastructure Lead |

### 6. AI Conversazione (Gemini)

| Campo | Valore |
|-------|--------|
| **Dati trattati** | Messaggi conversazione (system prompt, history, current message), user_id, deck_id, card_ids (per AI study), response_format (JSON/schema), temperature, maxTokens |
| **Finalità** | Studio conversazionale, generazione deck, dizionario contestuale, traduzione, spiegazioni |
| **Base giuridica** | Art. 6(1)(b) — esecuzione contratto |
| **Retention** | Conversazioni: non persistite server-side (stateless). History: solo in memoria client per durata sessione |
| **Subprocessor** | Google (Gemini API) — EU/US, DPA + SCC |
| **Diritti utente** | Accesso, Opposizione (non usa AI features), Cancellazione (non applicabile — stateless) |
| **Owner** | Team LingoCoon — AI/ML Lead |

### 7. Logging, Monitoring, Error Tracking (Sentry)

| Campo | Valore |
|-------|--------|
| **Dati trattati** | Error stack traces, breadcrumbs, release/environment tags, user_id (pseudonimizzato), transaction traces, performance metrics, session replay (masked), custom tags |
| **Finalità** | Debugging, monitoring performance, alerting, incident response |
| **Base giuridica** | Art. 6(1)(f) — interesse legittimo (sicurezza, affidabilità servizio) |
| **Retention** | Sentry: 90 giorni (default plan). Logs applicazione: 30 giorni |
| **Subprocessor** | Sentry (SaaS) — EU/US, DPA + SCC |
| **Misure privacy** | `beforeSend` scrubba: authorization, cookie, x-forwarded-for headers; cookies → `[REDACTED]`; 8 pattern frame vars (password, secret, token, key, authorization, cookie, credit_card, api_key); no PII in error messages |
| **Diritti utente** | Accesso (su richiesta), Cancellazione (contatta supporto), Limitazione |
| **Owner** | Team LingoCoon — Observability Lead |

### 8. Web Analytics (Vercel)

| Campo | Valore |
|-------|--------|
| **Dati trattati** | Pageviews, events custom, country, deviceType, osName, browserName, referrerHostname, route, utm_*, timestamp |
| **Finalità** | Analisi utilizzo, ottimizzazione UX, metriche business |
| **Base giuridica** | Art. 6(1)(f) — interesse legittimo (analytics anonimo/aggregato) |
| **Retention** | Vercel: per piano (default 30-90 giorni) |
| **Subprocessor** | Vercel (Web Analytics) — EU/US, DPA + SCC |
| **Diritti utente** | Opt-out via browser (no cookie tracking), Accesso aggregato |
| **Owner** | Team LingoCoon — Product/Analytics Lead |

---

## Subprocessor Registry

| Subprocessor | Servizio | Luogo | DPA | SCC | Scopo |
|--------------|----------|-------|-----|-----|-------|
| Supabase | PostgreSQL, Auth, Storage, Realtime | EU/US (AWS/GCP) | ✅ | ✅ | Database, Auth, File storage |
| Google Cloud | TTS (Chirp 3 HD), Gemini AI | EU/US | ✅ | ✅ | Speech synthesis, LLM |
| Endpoint STT | Whisper transcription | Configurabile | ⚠️ Da verificare | ⚠️ Da verificare | Speech-to-text |
| Sentry | Error tracking, performance, replay | EU/US | ✅ | ✅ | Observability |
| Vercel | Hosting, Functions, Analytics, Blob | EU/US (AWS/GCP) | ✅ | ✅ | Compute, Edge, Analytics |
| GitHub | CI/CD, Code hosting | US | ✅ | ✅ | Source control, CI |

---

## Data Retention Summary

| Categoria | Retention | Trigger Cancellazione |
|-----------|-----------|----------------------|
| Account/Profile | Durata rapporto + 30gg | Richiesta Art. 17 |
| Deck/Cards | Durata deck | Cancellazione deck/utente |
| Study Progress | Durata utilità + anonimizzazione | Richiesta Art. 17 |
| TTS Audio Cache | 30 giorni (TTL) | Scadenza automatica |
| TTS Budget/Accounting | 2 anni | Audit requirement |
| STT Audio | Immediato post-trascrizione | Completamento richiesta |
| AI Conversation | Solo sessione (stateless) | Fine sessione |
| Sentry Errors/Traces | 90 giorni | Piano Sentry |
| Vercel Analytics | 30-90 giorni | Piano Vercel |

---

## Diritti Utente — Processi

### Accesso (Art. 15)
- Endpoint: `/api/privacy/export` (da implementare)
- Formato: JSON strutturato per categoria
- Tempo: entro 30 giorni

### Rettifica (Art. 16)
- Profilo: `/settings` UI
- Deck/Cards: UI deck management
- Progresso: non modificabile (algoritmo), solo reset

### Cancellazione (Art. 17)
- Account: `/settings/delete-account` → cascade Supabase Auth + public tables
- Dati specifici: UI per deck/card/progress
- Anonimizzazione progressi: mantieni statistiche aggregate, rimuovi user_id

### Portabilità (Art. 20)
- Export: `/api/privacy/export` → JSON con profilo, deck, cards, progressi, budget TTS
- Formato: machine-readable, standard

### Opposizione (Art. 21)
- TTS: disabilita in settings
- STT: non concedere permesso microfono
- AI: non usa funzionalità AI
- Analytics: browser Do Not Track / opt-out Vercel

---

## Breach Escalation

| Livello | Azione | Tempo | Responsabile |
|---------|--------|-------|--------------|
| 1 — Sospetto | Indagine interna, contenimento | < 1 ora | Security Lead |
| 2 — Confermato | Notifica autorità (Garante) | < 72 ore | Privacy Lead + Legal |
| 3 — Rischio alto utenti | Notifica utenti interessati | Senza indebito ritardo | Privacy Lead + Comms |
| 4 — Post-incident | Report, lessons learned, aggiornamenti | < 30 giorni | Security Lead |

---

## Contatti

| Ruolo | Contatto |
|-------|----------|
| Data Controller | LingoCoon Team — privacy@lingocoon.example |
| DPO (se applicabile) | Da nominare |
| Security Lead | security@lingocoon.example |
| Subprocessor DPA | Archiviati in `/legal/dpa/` |

---

## Changelog

| Data | Versione | Modifiche | Autore |
|------|----------|-----------|--------|
| 2026-10-26 | 1.0 | Creazione iniziale | Claude Code |