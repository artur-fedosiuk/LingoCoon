'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ContextSourceEditor from './ContextSourceEditor';
import ContextReader from './ContextReader';
import { loadContextLanguageDefaults } from '@/lib/actions/context-studio-actions';
import { contextSessionSchema } from '@/lib/context-studio/reader-contract';
import type { ContextLanguage, ContextSession } from '@/types/context-studio';

export const CONTEXT_SAMPLE = `Learning a language becomes easier when the words belong to a real situation. My colleague walked into the bank to deposit money before our meeting. The clerk explained why the transfer would arrive on Monday, although we had expected it sooner and had already promised to pay the builder that afternoon.

Later, my colleague and I sat on the bank of the river and watched two ducks move slowly past the bridge. After the heavy rain, the bank was muddy, so we kept our bags on a dry rock and talked about the journey home.

Before leaving, we photographed the bank across the water. We wanted to remember the quiet path, the tall trees, and the small wooden sign that pointed visitors towards the village.`;

export default function ContextStudio() {
  const [draft, setDraft] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<ContextLanguage | ''>('');
  const [nativeLanguage, setNativeLanguage] = useState<ContextLanguage | ''>('');
  const { t } = useTranslation(undefined, { lng: nativeLanguage || undefined });
  const [session, setSession] = useState<ContextSession | null>(null);
  const [editing, setEditing] = useState(true);
  const [focusCount, setFocusCount] = useState(0);
  const [confirmApply, setConfirmApply] = useState(false);
  const nativeTouched = useRef(false);
  useEffect(() => {
    let active = true;
    void loadContextLanguageDefaults().then((defaults) => {
      if (active && !nativeTouched.current && defaults.nativeLanguage) setNativeLanguage(defaults.nativeLanguage);
    }).catch(() => { /* The explicit language selector remains available. */ });
    return () => { active = false; };
  }, []);
  const candidate = contextSessionSchema.safeParse({ sourceText: draft, sourceLanguage, nativeLanguage, revision: (session?.revision ?? 0) + 1 });
  const changed = !session || draft !== session.sourceText || sourceLanguage !== session.sourceLanguage || nativeLanguage !== session.nativeLanguage;
  function apply() {
    if (!candidate.success) return;
    if (changed && focusCount && !confirmApply) { setConfirmApply(true); return; }
    if (changed) { setSession(candidate.data); setFocusCount(0); }
    setEditing(false); setConfirmApply(false);
  }
  return <main className="dark min-h-dvh bg-background text-foreground">
    {editing && <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <a href="/dashboard" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">{t('context_studio.immersive.back')}</a>
      <h1 className="mb-2 mt-4 text-3xl font-semibold tracking-tight">Context Studio</h1>
      <p className="mb-8 text-muted-foreground">{t('context_studio.reader.bring_something_worth_reading')}</p>
      <ContextSourceEditor value={draft} onChange={(value) => { setDraft(value); setConfirmApply(false); }} sourceLanguage={sourceLanguage} nativeLanguage={nativeLanguage} onSourceLanguage={setSourceLanguage} onNativeLanguage={(value) => { nativeTouched.current = true; setNativeLanguage(value); }} />
      {confirmApply && <p role="alert" className="mt-4 rounded-lg border border-input p-4 text-sm">{t('context_studio.immersive.confirm_edit')}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button className="min-h-11 rounded-lg bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-40" disabled={!candidate.success} onClick={apply}>{t(confirmApply ? 'context_studio.immersive.apply_confirmed' : 'context_studio.immersive.start')}</button>
        {session && <button className="min-h-11 rounded-lg border px-4" onClick={() => { setDraft(session.sourceText); setSourceLanguage(session.sourceLanguage); setNativeLanguage(session.nativeLanguage); setEditing(false); setConfirmApply(false); }}>{t('context_studio.immersive.cancel')}</button>}
        <button className="min-h-11 px-2 text-sm underline" onClick={() => { setDraft(CONTEXT_SAMPLE); setSourceLanguage('en'); }}>{t('context_studio.reader.try_a_sample_text')}</button>
      </div>
    </div>}
    {session && <ContextReader key={session.revision} session={session} hidden={editing} onEdit={() => setEditing(true)} onReset={() => { setSession(null); setDraft(''); setFocusCount(0); setEditing(true); }} onFocusCount={setFocusCount} />}
  </main>;
}
