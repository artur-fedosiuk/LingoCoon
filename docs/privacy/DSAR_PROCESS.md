# Data Subject Access Request (DSAR) Process

> **bozza informativa — non consulenza legale**

## Panoramica

Processo per gestire richieste degli interessati (Art. 12-22 GDPR) entro i termini legali (30 giorni, estendibili a 60 per complessità).

---

## Canali di Ricezione

| Canale | Dettagli | Verifica Identità |
|--------|----------|-------------------|
| **Email** | privacy@lingocoon.example | Link conferma account registrato |
| **In-app** | `/settings/privacy/dsar` (da implementare) | Sessione autenticata |
| **Posta** | Indirizzo legale Titolare | Documento identità + prova account |

---

## Tipi di Richiesta e Workflow

### 1. Accesso (Art. 15) — "Quali dati avete su di me?"

**Workflow:**
1. Ricezione → Log in DSAR register (entro 24h)
2. Verifica identità → Entro 3 giorni lavorativi
3. Estrazione dati → Entro 20 giorni lavorativi
4. Formattazione → JSON strutturato per categoria (ROPA)
5. Consegna → Email crittografata / download sicuro / in-app
6. Chiusura → Aggiorna register, conferma ricezione

**Dati inclusi:**
- Profilo completo (profiles + auth.users campi non sensibili)
- Tutti i deck e cards dell'utente
- Progresso studio completo (study_progress)
- Budget e utilizzo TTS (reading_tts_* tables)
- Log Sentry pseudonimizzati (se richiesti esplicitamente)
- Analytics Vercel aggregati (se richiesti esplicitamente)

**Esclusioni:**
- Password hash, encrypted_password
- Dati di terzi (es. deck condivisi da altri — solo metadata)
- Log di sicurezza/infrastruttura non riferibili all'utente

---

### 2. Rettifica (Art. 16) — "I miei dati sono sbagliati"

**Workflow:**
1. Ricezione + verifica identità
2. Identifica campi contestati
3. Validazione: campi modificabili vs derivati/algoritmici
   - **Modificabili**: nickname, native_language, target_language, learning_purpose, learning_purpose_details, learning_profile
   - **Non modificabili (algoritmici)**: ease_factor, interval, repetitions, next_review_date, xp, streak (reset solo via cancellazione account)
   - **Non modificabili (audit)**: created_at, updated_at, id, email_confirmed_at
4. Applicazione rettifica → Audit log
5. Conferma all'interessato

---

### 3. Cancellazione (Art. 17) — "Cancellate i miei dati"

**Workflow:**
1. Ricezione + verifica identità forte (2FA / email conferma + password)
2. **Conferma esplicita** utente: "Questa azione è irreversibile. Perderai: account, deck, progresso, budget TTS, cronologia."
3. Esecuzione cancellazione (transazione atomica):
   ```
   BEGIN;
   -- 1. Anonimizza progressi studio (mantieni statistiche aggregate)
   UPDATE study_progress SET user_id = '00000000-0000-0000-0000-000000000000'::uuid
   WHERE user_id = :target_user_id;

   -- 2. Elimina deck e cards (CASCADE su study_progress già anonimizzato)
   DELETE FROM decks WHERE user_id = :target_user_id;

   -- 3. Elimina budget TTS
   DELETE FROM reading_tts_budget WHERE user_id = :target_user_id;
   DELETE FROM reading_tts_cache WHERE owner_id = :target_user_id;
   DELETE FROM reading_tts_admission WHERE owner_id = :target_user_id;

   -- 4. Elimina profilo
   DELETE FROM profiles WHERE id = :target_user_id;

   -- 5. Elimina auth user (trigger cascade su profiles)
   DELETE FROM auth.users WHERE id = :target_user_id;
   COMMIT;
   ```
4. Purge Sentry: API call per cancellazione dati utente (pseudonimizzato)
5. Purge Vercel Analytics: non applicabile (aggregato)
6. Conferma cancellazione completata + certificazione

**Eccezioni legittime (Art. 17(3)):**
- Obblighi legali (billing, audit trail 2 anni) → anonimizzazione, non cancellazione
- Difesa diritti legali → conservazione minima necessaria
- Interesse pubblico → valutazione caso per caso

---

### 4. Limitazione (Art. 18) — "Smettete di usare i miei dati"

**Workflow:**
1. Ricezione + verifica identità
2. Marca record: `processing_restricted = true` (campo da aggiungere a profiles)
3. Blocca elaborazione: TTS, AI, analytics, email marketing
4. Mantieni dati per: autenticazione, obblighi legali, difesa diritti
5. Notifica interessato quando limitazione revocata

---

### 5. Portabilità (Art. 20) — "Datemi i miei dati in formato machine-readable"

**Workflow:**
1. Ricezione + verifica identità
2. Genera export JSON (stesso formato Art. 15 + schema documentato)
3. Consegna: download link firmato (scadenza 7 giorni) / email crittografata
4. Formato: UTF-8, JSON Lines per array grandi, schema versionato

**Schema Export (v1):**
```json
{
  "export_version": "1.0",
  "exported_at": "2026-10-26T12:00:00Z",
  "user": { "id": "...", "email": "...", "profile": {...} },
  "decks": [{ "id": "...", "title": "...", "cards": [...] }],
  "study_progress": [{ "card_id": "...", "ease_factor": 2.5, ... }],
  "tts_budget": { "lifetime_used": 12345, "daily_used": 100 },
  "tts_cache": [{ "text_hash": "...", "audio_url": "..." }]
}
```

---

### 6. Opposizione (Art. 21) — "Non voglio questo trattamento"

**Per finalità marketing/analytics:**
- Immediato: opt-out flag su profiles, stop analytics/tracking
- Nessuna verifica identità forte richiesta (browser DNT / cookie banner)

**Per finalità legittimo interesse (es. security logging):**
- Valutazione bilanciamento interessi
- Se prevale interessato → limitazione (Art. 18)
- Se prevale Titolare → risposta motivata entro 30 giorni

---

## Register DSAR (Obbligatorio Art. 30)

| Campo | Esempio |
|-------|---------|
| ID richiesta | DSAR-2026-001 |
| Data ricezione | 2026-10-26 |
| Tipo richiesta | Accesso / Cancellazione / Rettifica / ... |
| Canale | Email / In-app / Posta |
| Interessato (pseudonimo) | user_abc123 |
| Verifica identità completata | 2026-10-27 |
| Scadenza legale | 2026-11-25 (30 giorni) |
| Estensione | No / Sì (motivo: complessità) |
| Stato | In elaborazione / Completato / Respinto / In attesa chiarimenti |
| Data completamento | 2026-11-10 |
| Note | Richiesta accesso + portabilità |

---

## Template Risposte

### Ricezione (entro 24h)
```
Oggetto: Ricevuta richiesta privacy — DSAR-2026-XXX

Gentile [nome/nickname],

Abbiamo ricevuto la sua richiesta del [data] relativa a [tipo diritto].
La stiamo processando e le risponderemo entro 30 giorni (entro il [data scadenza]).

Se necessita di chiarimenti, risponda a questa email.

Cordiali saluti,
Team Privacy LingoCoon
```

### Completamento Accesso/Portabilità
```
Oggetto: Dati personali richiesti — DSAR-2026-XXX

Gentile [nome/nickname],

In allegato / al link sicuro sotto trova i suoi dati personali in formato JSON strutturato.

Il link scade il [data + 7 giorni]. Per scaricare di nuovo, contatti privacy@lingocoon.example.

Struttura file:
- user_profile.json
- decks_and_cards.json
- study_progress.json
- tts_budget_and_cache.json
- README_EXPORT.md (spiega schema)

Cordiali saluti,
Team Privacy LingoCoon
```

### Completamento Cancellazione
```
Oggetto: Conferma cancellazione account — DSAR-2026-XXX

Gentile [nome/nickname],

Confermiamo che il suo account e tutti i dati associati sono stati cancellati in data [data].

Dettagli:
- Account autenticazione: eliminato
- Profilo: eliminato
- Deck e flashcard: eliminati
- Progresso studio: anonimizzato (statistiche aggregate mantenute)
- Budget e cache TTS: eliminati
- Log Sentry: pseudonimizzati eliminati su richiesta

Non è più possibile recuperare questi dati. Per un nuovo account, registri nuovamente su LingoCoon.

Cordiali saluti,
Team Privacy LingoCoon
```

### Rigetto (con motivazione)
```
Oggetto: Impossibile accogliere richiesta — DSAR-2026-XXX

Gentile [nome/nickname],

Non possiamo accogliere la sua richiesta di [tipo] per il seguente motivo:
[es. obbligo legale conservazione billing 2 anni / difesa diritti legali / identità non verificata]

Ha diritto di proporre reclamo all'Autorità Garante (www.garanteprivacy.it) o ricorso giurisdizionale.

Cordiali saluti,
Team Privacy LingoCoon
```

---

## Escalation e Eccezioni

| Situazione | Azione |
|------------|--------|
| Identità non verificabile | Richiesta documento identità + selfie con documento / 2FA |
| Richiesta manifestamente infondata/eccessiva | Rigetto motivato (Art. 12(5)) — può addebitare fee ragionevole |
| Estensione termini (complessità) | Notifica entro 30 giorni + motivo + nuova scadenza (max +60 giorni) |
| Violazione dati durante DSAR | Processo breach notification parallelo, informa interessato |
| Reclamo Garante | Cooperazione completa, referente legale attivato |

---

## Automazione (Da Implementare)

| Componente | Stato | Note |
|------------|-------|------|
| Endpoint `/api/privacy/export` | 🔴 Non iniziato | Genera JSON Art. 15/20 |
| Endpoint `/api/privacy/delete-account` | 🔴 Non iniziato | Transazione atomica cancellazione |
| In-app DSAR form | 🔴 Non iniziato | `/settings/privacy/dsar` |
| DSAR register (DB) | 🔴 Non iniziato | Tabella `privacy.dsar_requests` |
| Sentry user data purge API | 🟡 Parziale | Da integrare in cancellazione |
| Email templates | 🟡 Bozza | Questo documento |

---

## Contatti

| Ruolo | Email | SLA Risposta |
|-------|-------|--------------|
| Privacy Lead | privacy@lingocoon.example | 24h |
| Security Lead | security@lingocoon.example | 4h (breach) |
| Legal | legal@lingocoon.example | 3 giorni lavorativi |

---

## Changelog

| Data | Versione | Modifiche | Autore |
|------|----------|-----------|--------|
| 2026-10-26 | 1.0 | Creazione iniziale | Claude Code |