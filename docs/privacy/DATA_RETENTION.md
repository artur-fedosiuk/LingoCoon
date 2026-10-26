# Data Retention Policy

> **bozza informativa — non consulenza legale**

## Principi Guida

1. **Minimizzazione**: Conservare solo ciò che serve, per il tempo strettamente necessario
2. **Finalità**: Ogni categoria ha retention legata alla base giuridica del trattamento
3. **Automazione**: Job pianificati per cancellazione/anonimizzazione, non processi manuali
4. **Auditabilità**: Log di ogni cancellazione/anonimizzazione con timestamp e trigger
5. **Rollback**: Backup point-in-time per recovery accidentale (max 30 giorni)

---

## Retention per Categoria

| Categoria | Tabella/Origine | Retention | Trigger Cancellazione | Metodo | Note |
|-----------|-----------------|-----------|----------------------|--------|------|
| **Account/Profilo** | `auth.users`, `public.profiles` | Durata rapporto + 30gg | Richiesta Art. 17 / inattività 2 anni | Hard delete (cascade) | 30gg grace period per ripensamento |
| **Deck/Flashcard** | `public.decks`, `public.cards` | Durata deck | Cancellazione deck/utente | Hard delete (cascade) | CASCADE da decks→cards→study_progress |
| **Progresso Studio** | `public.study_progress` | Durata utilità + anonimizzazione | Richiesta Art. 17 / account cancellato | Anonimizzazione (user_id → NULL/zero UUID) | Statistiche aggregate mantenute |
| **TTS Audio Cache** | `public.reading_tts_cache` | 30 giorni (TTL) | Scadenza `expires_at` | Job cron giornaliero `DELETE WHERE expires_at < now()` | Soft delete, audio su Blob storage |
| **TTS Budget/Accounting** | `public.reading_tts_budget`, `public.google_tts_budget_periods` | 2 anni | Fine periodo budget + 2 anni | Hard delete | Audit requirement (billing/costi) |
| **TTS Admission/Dispatch** | `public.reading_tts_admission`, `public.reading_tts_dispatch_windows` | 90 giorni | Completamento window + 90gg | Hard delete | Operational logging |
| **STT Audio** | Endpoint STT (temp) | Immediato post-trascrizione | Completamento richiesta | Auto-delete endpoint | Non persistito su LingoCoon DB |
| **AI Conversation** | Gemini API (stateless) | Solo sessione | Fine sessione | Non applicabile | Nessuna persistenza server-side |
| **Sentry Errors/Traces** | Sentry SaaS | 90 giorni (piano default) | Piano Sentry | Auto-purge Sentry | `beforeSend` scrubba PII |
| **Sentry Session Replay** | Sentry SaaS | 90 giorni / 1 anno (errori) | Piano Sentry | Auto-purge Sentry | Masked inputs, no PII |
| **Vercel Analytics** | Vercel Web Analytics | 30-90 giorni | Piano Vercel | Auto-purge Vercel | Aggregato, no cookie tracking |
| **Vercel Runtime Logs** | Vercel Functions | Piano Vercel (default 30gg) | Piano Vercel | Auto-purge Vercel | No PII per design |
| **GitHub Actions Logs** | GitHub | 90 giorni (default) | Piano GitHub | Auto-purge GitHub | No segreti (secret scanner) |
| **Backup Database** | Supabase PITR | 7 giorni (PITR) / 30 giorni (manual) | Scadenza retention | Auto-purge Supabase | Point-in-time recovery only |

---

## Job di Cancellazione Automatica

### Cron Jobs (da implementare come Supabase pg_cron o Vercel Cron)

```sql
-- 1. TTS Cache cleanup (giornaliero, 03:00 UTC)
-- DELETE FROM public.reading_tts_cache WHERE expires_at < now();

-- 2. TTS Admission cleanup (giornaliero, 03:15 UTC)
-- DELETE FROM public.reading_tts_admission
-- WHERE expires_at < now() AND status IN ('completed', 'expired', 'rejected');

-- 3. Dispatch windows cleanup (settimanale, domenica 04:00 UTC)
-- DELETE FROM public.reading_tts_dispatch_windows
-- WHERE ends_at < now() - interval '90 days';

-- 4. Account inattivi (mensile, 1° giorno 05:00 UTC)
-- Anonimizza study_progress per utenti inattivi > 2 anni
-- UPDATE public.study_progress
-- SET user_id = '00000000-0000-0000-0000-000000000000'::uuid
-- WHERE user_id IN (
--   SELECT id FROM auth.users
--   WHERE last_sign_in_at < now() - interval '2 years'
-- );

-- 5. Budget periods vecchi (mensile, 1° giorno 05:30 UTC)
-- DELETE FROM public.google_tts_budget_periods
-- WHERE ends_at < now() - interval '2 years' AND reconciled_at IS NOT NULL;
```

### Vercel Cron Config (vercel.ts)

```typescript
crons: [
  { path: '/api/cron/tts-cache-cleanup', schedule: '0 3 * * *' },
  { path: '/api/cron/tts-admission-cleanup', schedule: '15 3 * * *' },
  { path: '/api/cron/dispatch-windows-cleanup', schedule: '0 4 * * 0' },
  { path: '/api/cron/inactive-accounts', schedule: '0 5 1 * *' },
  { path: '/api/cron/budget-periods', schedule: '30 5 1 * *' },
]
```

---

## Anonimizzazione vs Cancellazione

| Approccio | Quando Usare | Implementazione |
|-----------|--------------|-----------------|
| **Hard Delete** | Dati direttamente identificativi, nessuna necessità statistica | `DELETE` con CASCADE |
| **Anonimizzazione** | Dati utili per analytics aggregate, request Art. 17 | `UPDATE SET user_id = zero-UUID` + rimuovi PII |
| **Pseudonimizzazione** | Log sicurezza, audit trail, debugging | Hash irreversibile user_id (es. SHA-256 + salt) |

### Regola Progresso Studio (Art. 17 + interesse legittimo)

```sql
-- Su richiesta cancellazione Art. 17:
-- 1. Anonimizza study_progress (mantieni distribution ease_factor, interval, repetitions per ricerca algoritmo)
UPDATE public.study_progress
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE user_id = :target_user_id;

-- 2. Elimina tutto il resto (deck, cards, profilo, budget TTS)
-- CASCADE gestisce cards → study_progress (già anonimizzato)
```

---

## Backup e Disaster Recovery

| Livello | Frequenza | Retention | Scope | Recovery Time Objective (RTO) |
|---------|-----------|-----------|-------|-------------------------------|
| **PITR (Point-in-Time Recovery)** | Continuo (WAL) | 7 giorni | Full DB | < 1 ora (qualsiasi secondo) |
| **Manual Snapshot** | Giornaliero (02:00 UTC) | 30 giorni | Full DB | < 4 ore |
| **Logical Backup (pg_dump)** | Settimanale (domenica 03:00) | 90 giorni | Schema + data | < 8 ore |
| **Cross-region Replica** | Real-time | 7 giorni | Read replica EU-West | < 15 min failover |

**Test Restore**: Mensile (1° weekend), documentato in runbook.

---

## Eccezioni e Legal Hold

| Situazione | Override Retention | Durata | Autorizzazione |
|------------|-------------------|--------|----------------|
| **Litigio in corso** | Sospendi cancellazione dati rilevanti | Fino a risoluzione + 1 anno | Legal Lead |
| **Indagine sicurezza** | Sospendi cancellazione log rilevanti | Fino a chiusura indagine | Security Lead |
| **Richiesta Autorità** | Conserva per conformità | Come richiesto | Privacy Lead + Legal |
| **Audit finanziario** | Budget TTS accounting | 7 anni (requisito fiscale IT) | Finance Lead |

**Processo Legal Hold:**
1. Notifica scritta a Engineering + Privacy
2. Tag risorse interessate (`legal_hold = true` in metadata)
3. Sospendi job automatici su quelle risorse
4. Rimozione hold → riattivazione job + retention normale

---

## Documentazione Cancellazioni (Audit Trail)

Tabella: `privacy.retention_audit_log` (da creare)

```sql
CREATE TABLE privacy.retention_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at timestamptz NOT NULL DEFAULT now(),
  job_name text NOT NULL,           -- es. 'tts-cache-cleanup', 'inactive-accounts-anonymize'
  trigger_type text NOT NULL,       -- 'cron', 'manual', 'dsar', 'legal_hold_release'
  table_name text NOT NULL,         -- es. 'reading_tts_cache', 'study_progress'
  rows_affected integer NOT NULL,
  criteria jsonb NOT NULL,          -- es. '{ "expires_at_lt": "2026-10-26T00:00:00Z" }'
  executed_by text NOT NULL,        -- 'pg_cron', 'vercel-cron', 'user:privacy-lead', 'system:dsar-123'
  notes text
);

CREATE INDEX idx_retention_audit_executed_at ON privacy.retention_audit_log (executed_at DESC);
CREATE INDEX idx_retention_audit_table ON privacy.retention_audit_log (table_name);
```

---

## Conformità Normativa

| Normativa | Requisito | Implementazione LingoCoon |
|-----------|-----------|---------------------------|
| **GDPR Art. 5(1)(e)** | Limitazione conservazione | Questa policy + job automatici |
| **GDPR Art. 17** | Diritto cancellazione | DSAR_PROCESS.md + anonimizzazione progressi |
| **GDPR Art. 30** | Registro trattamenti | ROPA.md + retention_audit_log |
| **GDPR Art. 32** | Sicurezza trattamento | Cifratura, access control, backup |
| **Legge italiana billing** | Conservazione fatture 10 anni | Budget TTS accounting 2 anni (solo metadata costi, non fatture) |
| **ePrivacy Directive** | Log accessi comunicazioni | Vercel/Sentry retention per piano |

---

## Metriche e Monitoraggio

| Metrica | Target | Alert Se |
|---------|--------|----------|
| Job cleanup eseguiti | 100% schedule | Qualsiasi job mancato |
| Righe eliminate per job | > 0 (se dati scaduti) | 0 righe per 7 giorni consecutivi |
| Anonimizzazioni Art. 17 | < 24h da richiesta | > 24h |
| Backup restore test | Mensile成功率 100% | Qualsiasi fallimento |
| Legal hold attivi | 0 (steady state) | > 0 per > 30 giorni senza aggiornamento |

---

## Ruoli e Responsabilità

| Ruolo | Responsabilità |
|-------|----------------|
| **Privacy Lead** | Policy owner, approva eccezioni, audit compliance |
| **Engineering Lead** | Implementa job, monitora esecuzione, testa restore |
| **Security Lead** | Legal hold per indagini, breach retention |
| **Legal Lead** | Legal hold per litigation, conformità normativa |
| **Finance Lead** | Requisiti retention fiscale/billing |

---

## Changelog

| Data | Versione | Modifiche | Autore |
|------|----------|-----------|--------|
| 2026-10-26 | 1.0 | Creazione iniziale | Claude Code |