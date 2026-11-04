# Data Processing Addendum (DPA) Template

> **bozza informativa — non consulenza legale**

## Premessa

Questo DPA regola il trattamento di dati personali per conto di LingoCoon (Titolare) da parte dei Subprocessor (Responsabili). Deve essere firmato da ogni subprocessor prima del trasferimento dati.

---

## 1. Definizioni

| Termine | Definizione |
|---------|-------------|
| **Titolare** | LingoCoon Team (data controller) |
| **Responsabile** | Subprocessor che tratta dati per conto del Titolare |
| **Interessato** | Utente finale di LingoCoon |
| **Dati Personali** | Qualsiasi informazione relativa a persona fisica identificata/identificabile |
| **Trattamento** | Qualsiasi operazione sui dati (raccolta, uso, conservazione, cancellazione, ecc.) |
| **Violazione** | Violazione della sicurezza che comporta distruzione, perdita, modifica, divulgazione non autorizzata |

---

## 2. Oggetto, Natura, Finalità e Durata del Trattamento

| Subprocessor | Oggetto | Natura | Finalità | Durata |
|--------------|---------|--------|----------|--------|
| **Supabase** | Auth, Database, Storage, Realtime | Hosting PostgreSQL, gestione autenticazione, file storage | Erogazione servizio LingoCoon | Durata contratto + 30gg post-cancellazione |
| **Google Cloud** | TTS (Chirp 3 HD), Gemini AI | Sintesi vocale, LLM conversazionale | Funzionalità TTS, AI study, dizionario | Durata contratto |
| **Endpoint STT** | Whisper transcription | Speech-to-text | Input vocale speaking practice | Durata contratto |
| **Sentry** | Error tracking, performance, session replay | Monitoring, debugging, alerting | Affidabilità, sicurezza servizio | 90 giorni (default plan) |
| **Vercel** | Hosting, Functions, Analytics, Blob | Compute edge, analytics, file storage | Erogazione applicazione web | Durata contratto |
| **GitHub** | CI/CD, Code hosting | Source control, build automation | Sviluppo, deployment | Durata contratto |

---

## 3. Obblighi del Responsabile

Il Responsabile si impegna a:

1. **Trattare solo su istruzioni documentate** del Titolare (Art. 28(3)(a) GDPR)
2. **Garantire riservatezza** del personale autorizzato al trattamento (Art. 28(3)(b))
3. **Implementare misure tecniche/organizzative** appropriate (Art. 28(3)(c), Art. 32 GDPR)
4. **Non coinvolgere sub-responsabili** senza autorizzazione scritta preventiva del Titolare (Art. 28(4))
5. **Assistere il Titolare** per diritti interessati (Art. 28(3)(e), Art. 12-22 GDPR)
6. **Assistere per notifiche violazione** (Art. 28(3)(f), Art. 33-34 GDPR)
7. **Cancellare/Restituire dati** a fine trattamento (Art. 28(3)(g))
8. **Mettere a disposizione informazioni** per audit (Art. 28(3)(h))

---

## 4. Misure Tecniche e Organizzative (Art. 32 GDPR)

### Minimo richiesto per tutti i Subprocessor

| Misura | Descrizione | Verifica |
|--------|-------------|----------|
| **Cifratura in transito** | TLS 1.2+ per tutte le connessioni | Certificati SSL/TLS validi |
| **Cifratura a riposo** | AES-256 per database, storage, backup | Configurazione provider |
| **Controllo accessi** | RBAC, principio minimo privilegio, MFA admin | Policy IAM, audit log |
| **Logging e monitoraggio** | Audit trail accessi, modifiche, esportazioni | Log retention 1+ anni |
| **Backup e disaster recovery** | Backup giornalieri, RPO < 24h, RTO < 4h | Test restore periodici |
| **Gestione vulnerabilità** | Patch management, scanning dipendenze | SLA patch critiche < 72h |
| **Formazione personale** | Security awareness annuale | Registro formazione |
| **Incident response** | Piano IR testato, escalation 24/7 | Documentazione, drill annuali |

### Supabase — Specifico

- Row Level Security (RLS) attivo su tutte le tabelle
- Policies con `WITH CHECK` ownership verification
- `security definer` functions con `SET search_path`
- Service role key solo per admin operations, non in app code

### Google Cloud — Specifico

- VPC Service Controls per isolamento progetti
- Binary Authorization per container images
- Secret Manager per API keys (no hardcoded)
- Data Loss Prevention (DLP) API per scanning PII

### Sentry — Specifico

- `beforeSend` scrubbing: headers (auth, cookie, x-forwarded-for), frame vars (password, secret, token, key, authorization, cookie, credit_card, api_key)
- User ID pseudonimizzato (hash)
- Session Replay: mask all inputs, no PII capture
- Data residency: EU region selezionata

### Vercel — Specifico

- Edge Config (Global Config) per feature flags, no PII
- Blob storage: private buckets per default
- Functions: no persistent storage, stateless
- Analytics: aggregated, no cookie tracking

---

## 5. Sub-responsabili (Sub-processors)

Il Responsabile può coinvolgere sub-responsabili solo con:

1. **Autorizzazione scritta preventiva** del Titolare (generale o specifica)
2. **Contratto scritto** che impone stessi obblighi di questo DPA
3. **Notifica al Titolare** di ogni nuovo sub-responsabile (min 30 giorni prima)

### Sub-responsabili autorizzati (allegato aggiornabile)

| Responsabile | Sub-responsabile | Servizio | Luogo |
|--------------|------------------|----------|-------|
| Supabase | AWS / GCP | Infrastructure hosting | EU/US |
| Google Cloud | Google LLC | Infrastructure hosting | EU/US |
| Sentry | AWS / GCP | Infrastructure hosting | EU/US |
| Vercel | AWS / GCP | Infrastructure hosting | EU/US |

---

## 6. Trasferimenti Internazionali

Se il trattamento avviene fuori SEE/UK:

- **Standard Contractual Clauses (SCC) 2021** modulo controller-to-processor
- **Supplementary measures** se legge paese terzo richiede accesso autorità (Schrems II)
- **Transfer Impact Assessment (TIA)** documentato per ogni trasferimento
- **Alternative**: Binding Corporate Rules (BCR) o codici di condotta approvati

Stato attuale: tutti i subprocessor hanno SCC 2021 + supplementary measures documentate.

---

## 7. Diritti degli Interessati — Assistenza Responsabile

Il Responsabile deve assistere il Titolare entro **10 giorni lavorativi** per:

| Diritto | Azione Responsabile |
|---------|---------------------|
| **Accesso (Art. 15)** | Esporta dati interessato in formato strutturato |
| **Rettifica (Art. 16)** | Corregga/integra dati inesatti |
| **Cancellazione (Art. 17)** | Elimini dati (compresi backup) entro 30gg |
| **Limitazione (Art. 18)** | Segni dati come "restricted", non tratti |
| **Portabilità (Art. 20)** | Fornisca dati in formato machine-readable |
| **Opposizione (Art. 21)** | Cessi trattamento per finalità opposte |

---

## 8. Violazione Dati (Data Breach) — Art. 33-34 GDPR

### Obblighi Responsabile

1. **Notifica al Titolare**: senza indebito ritardo, max **24 ore** da scoperta
2. **Contenuto notifica**: natura, categorie interessati/dati, probabili conseguenze, misure adottate/previste
3. **Cooperazione**: supporto indagine, mitigazione, notifica autorità/utenti

### Template Notifica Breach (da Responsabile a Titolare)

```
OGGETTO: DATA BREACH NOTIFICATION — [Subprocessor Name] — [Date/Time UTC]

1. Descrizione violazione:
2. Data/ora scoperta:
3. Data/ora inizio presunta:
4. Categorie dati coinvolti:
5. Numero interessati stimato:
6. Conseguenze probabili:
7. Misure adottate:
8. Misure previste:
9. Contatto referente sicurezza:
10. Allegati (log, screenshot, forensic):
```

---

## 9. Audit e Ispezioni

- **Diritto audit**: Titolare può auditare (o far auditare da terzi) il Responsabile
- **Preavviso**: 30 giorni lavorativi (salvo emergenza sicurezza)
- **Scope**: misure tecniche/organizzative, sub-responsabili, conformità DPA
- **Report**: condiviso con Titolare, piano remediation se findings
- **Costi**: a carico Titolare, salvo violazioni gravi Responsabile

---

## 10. Durata e Risoluzione

| Evento | Effetto |
|--------|---------|
| **Fine contratto servizio** | DPA termina automaticamente |
| **Risoluzione per causa** (violazione materiale DPA) | 30 giorni per rimediare, poi risoluzione immediata |
| **Risoluzione Titolare** | In qualsiasi momento con preavviso 30 giorni |
| **Post-risoluzione** | Cancellazione/Restituzione dati entro 60 giorni + certificazione scritta |

---

## 11. Responsabilità e Indennizzo

- Responsabile risponde per danni da violazione DPA (Art. 82 GDPR)
- Indennizzo Titolare per sanzioni, costi notifica, spese legali da violazione Responsabile
- Limite responsabilità: concordato per contratto (min. 2x fee annuali)

---

## 12. Legge Applicabile e Foro

- **Legge**: Italiana / GDPR
- **Foro**: Tribunale competente per sede Titolare
- **Risoluzione controversie**: Mediazione obbligatoria prima di giudizio

---

## Allegato A — Elenco Dati Personali per Subprocessor

*Da completare per ogni subprocessor con dettaglio campi esatti*

### Supabase
- `auth.users`: id, email, created_at, last_sign_in_at, encrypted_password, email_confirmed_at, phone, raw_app_meta_data, raw_user_meta_data
- `public.profiles`: id, email, nickname, native_language, target_language, current_level, learning_purpose, learning_purpose_details, onboarding_completed_at, learning_profile, xp, streak, onboarding_completed, created_at, updated_at
- `public.decks`: id, user_id, title, description, language_from, language_to, created_at, updated_at
- `public.cards`: id, deck_id, front, back, example_sentence, pronunciation, difficulty, created_at, updated_at
- `public.study_progress`: id, user_id, card_id, last_reviewed_at, quality_rating, ease_factor, interval, repetitions, next_review_date, created_at, updated_at

### Google Cloud (TTS)
- Testo da sintetizzare, audio restituito, metadata: user_id, deck_id, card_id, voice, language, speed, character_count, timestamp, budget_period_id
- Budget tables: lifetime_limit, daily_limit, user_daily_limit, credit_expires_at, lifetime_used
- Cache: text_hash, voice_id, language_code, speed, audio_url, size_bytes, created_at, expires_at

### Google Cloud (Gemini)
- Messaggi conversazione (system prompt, history, current message), user_id, deck_id, card_ids, response_format, temperature, maxTokens

### Sentry
- Error stack traces, breadcrumbs, release/environment tags, user_id (pseudonimizzato), transaction traces, performance metrics, session replay (masked)

### Vercel
- Pageviews, events custom, country, deviceType, osName, browserName, referrerHostname, route, utm_*, timestamp

### Endpoint STT
- Audio registrato (temporaneo), trascrizione (solo sessione), metadata: user_id, timestamp, model_id

---

## Allegato B — Contatti Referenti Sicurezza

| Subprocessor | Referente Sicurezza | Email | Telefono (emergenza) |
|--------------|---------------------|-------|---------------------|
| Supabase | Security Team | security@supabase.io | +1-xxx-xxx-xxxx |
| Google Cloud | Cloud Security | cloud-security@google.com | N/A (console) |
| Sentry | Security Team | security@sentry.io | N/A (dashboard) |
| Vercel | Security Team | security@vercel.com | N/A (dashboard) |
| Endpoint STT | [Da definire] | [Da definire] | [Da definire] |

---

## Firma

**Titolare — LingoCoon Team**

Firma: _________________________  Data: _______________

Nome: _________________________  Ruolo: _______________

**Responsabile — [Subprocessor Name]**

Firma: _________________________  Data: _______________

Nome: _________________________  Ruolo: _______________