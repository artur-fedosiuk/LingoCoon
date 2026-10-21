# Build polished Context Studio reader

> Act as LingoCoon’s technical lead and sole delivery owner. This task replaces the previous coordination conversation. Do not retrieve its entire history: use the current repository and authoritative documents.
>
> Start by:
>
> 1. Reading AGENTS.md, .agents/project/AGENTS.md, and .agents/README.md.
> 2. Reading docs/product/context-studio.md and docs/agents/chat-starters.md.
> 3. Checking the current Git branch, status, relevant changes, and untracked files.
> 4. Loading only the skills required for the active task. Do not run every skill or spawn departments by default.
>
> Current priority
> Build a genuinely useful, polished Context Studio reader inspired by the strongest general interactions of Readlang and Language Reactor. The existing implementation is a local prototype, not an accepted finished feature.
>
> The intended experience:
>
> - Reading-first workspace, with import/edit separate from reading.
> - One-click word lookup and straightforward phrase selection.
> - Exact source-occurrence identity, including repeated words with different meanings.
> - Immediate contextual help near the selection and a well-organized detail panel.
> - Automatic translation with optional sentence-aligned bilingual display.
> - Preserved reading position, usable desktop/mobile layouts, keyboard access, and clear loading/error/recovery states.
> - Contextual phrases and eventual active language use, not a flashcard-first experience.
>
> Known handoff
> The previous workflow produced too much planning and insufficient result verification. Useful UX requirements were omitted. Four original reader tests did not execute application code; they were replaced. Local fixes addressed obsolete AI responses, reset/error handling, focus deduplication, and sentence punctuation boundaries.
>
> Previous verification reported 26 passing tests, passing lint/TypeScript, and a passing Webpack build. The standard Turbopack build failed on a port-binding error. These are historical observations: verify relevant current results yourself. Authenticated browser validation and live AI quality remain unverified. Do not mistake helper tests for component or end-to-end coverage.
>
> Working method
>
> - Own one coherent, usable slice from implementation through verification.
> - Reuse existing research and contracts; research only unresolved questions that affect implementation.
> - Use a bounded read-only specialist only when independent review materially helps.
> - Preserve existing uncommitted changes. Never assume another task’s files are disposable.
> - Keep accepted scope, ownership, evidence, blockers, and next action in the existing Context Studio document.
> - For UI changes, inspect the rendered result at desktop and narrow widths and compare it with the references.
> - Never claim completion from compilation alone. Clearly separate implemented, verified, failed, and unverified behavior.
> - Do not bypass authentication, copy session tokens, read secrets, or invent provider results.
>
> Boundaries
> This initial prompt authorizes inspection and planning only. Before editing, propose one concrete next slice and obtain my approval. Do not commit, push, change dependencies, modify remote services/database settings, deploy, or introduce costs without explicit authorization. Persistent AI/TTS/STT quotas remain deferred.
>
> Communicate with me in concise Italian. Use professional English for repository artifacts. Avoid long reports, repeated context, and unnecessary task coordination.
>
> Your first response should briefly state:
>
> 1. What currently exists.
> 2. The most important quality gaps.
> 3. The next coherent slice you recommend implementing.
> 4. How you will demonstrate that it works.
>
> Do not restart the product roadmap or create new tasks.

<details><summary>6 previous messages</summary>

> Leggo le istruzioni e i documenti correnti, poi verifico il prototipo e le modifiche locali. Ti proporrò una sola slice concreta, con prove di funzionamento, prima di modificare file.
>
> <details><summary>Explored a search, ran 2 commands</summary>
>
> - Ran `cat AGENTS.md .agents/project/AGENTS.md .agents/README.md docs/product/context-studio.md docs/agents/chat-starters.md`
>
> - Ran `git status --short --branch`
>
> <details><summary>Explored a search</summary>
>
> - Searched for `Context Studio|LC-IMPLEMENT|reader` in `MEMORY.md`
>
> </details>
>
> </details>
>
> Il documento è chiaro sullo stato di prototipo, ma il branch attuale è `main`, non `context-studio-reader`. Le modifiche locali sono presenti: le preservo. Uso la skill `lingocoon-ux` per definire la slice e i criteri osservabili.
>
> <details><summary>Ran 5 commands</summary>
>
> - Ran `cat .agents/skills/lingocoon-ux/SKILL.md .agents/project/configuration-map.md docs/design/ux-principles.md docs/design/visual-system.md package.json`
> - Ran `rg --files src/components/context-studio src/lib/context-studio src/app/context-studio; git diff --stat; git diff -- src/components/layout/AppShell.tsx src/app/dashboard/page.tsx; git ls-files --others --exclude-standard; git rev-list --left-right --count HEAD...origin/main`
> - Ran `cat src/components/context-studio/*.tsx src/lib/context-studio/*.ts src/types/context-studio.ts`
> - Ran `cat .agents/skills/lingocoon-minimal/SKILL.md docs/design/visual-system.md src/components/context-studio/ContextReadingSurface.tsx src/lib/actions/context-studio-actions.ts src/lib/server/context-studio-schema.ts package.json`
> - Ran `git diff --stat; git diff -- src/components/layout/AppShell.tsx src/app/dashboard/page.tsx; git rev-list --left-right --count HEAD...origin/main; cat src/app/context-studio/page.tsx`
>
> </details>
>
> Ho confermato il difetto principale nel codice: selezione, cache e richiesta AI identificano la frase dal testo, quindi due occorrenze uguali possono ricevere lo stesso contesto. Anche il bilingue è composto da due colonne indipendenti. Carico inoltre `lingocoon-minimal`, richiesto dalla skill UX, e verifico i test attuali.
>
> <details><summary>Ran 2 commands</summary>
>
> - Ran `npm run test:security`
> - Ran `cat docs/design/ux-principles.md; git diff --check; rg -n 'test\(|import|readFile' tests/context-studio.test.mjs`
>
> </details>
</details>

1. **Esiste un prototipo locale** con import/edit separati dalla lettura, selezione, traduzione AI, pannello dettagli e tre espressioni focus. Il branch attuale è `main`, allineato al riferimento locale `origin/main`; navigazione e reader hanno modifiche non committate. Ho rieseguito i test: **26 passano**, ma non verificano i componenti React o il flusso autenticato.

2. **Il blocco principale è la correttezza del contesto:** parole ripetute vengono risolte alla prima occorrenza, anche nella cache e nella richiesta AI. Mancano inoltre vero allineamento bilingue, significato vicino alla selezione, recupero esplicito dagli errori e prove di usabilità mobile.

3. **Propongo una slice: leggere e capire senza perdere il punto.** Comprende selezioni con offset validati sul server, aiuto vicino alla parola, dettagli laterali su desktop e pannello inferiore su mobile, traduzione per frasi identificate, retry e ritorno al punto selezionato. Posizione conservata durante apertura/chiusura dei dettagli e cambio bilingue. Modifiche limitate ai file Context Studio, relativi test e documento esistente; nessuna nuova dipendenza o costo. Correggere soltanto gli offset sarebbe più piccolo, ma lascerebbe incompleto il percorso d’uso.

4. **La dimostrazione:** testo con due significati di “bank”, selezioni multiparola e paragrafi lunghi; verifica dei componenti reali, risposte fuori ordine ed errori; confronto visivo desktop/320px con i riferimenti, tastiera e zoom. Eseguirò i controlli statici e build, separando prove simulate, browser autenticato e qualità AI reale. Queste ultime sono ancora non verificate.

**Approvi questa slice e il perimetro indicato?** Non ho modificato file; l’approvazione prima degli interventi è richiesta esplicitamente dal tuo messaggio.

> prima voglio capire se hai capito cosa stiamo facendo, è una startup molto seria quindi la produzione deve essere di qualità, sei colui che gestisce la produzione hai tutti i ruoli che ti servono divisi in chat. In questa chat facciamo le decisioni e poi con un prompt pronto passo ad un altro chat a fare effettivamente il lavoro, io mi limito a leggere e incollare il prompt e testare se tutto corrisponde ad un prodotto di qualità. Ora, rispondimi se è tutto chiaro e se bisogna fare qualcos'altro o possiamo subito mettersi al lavoro se bisogna sistemare prima qualcosa

Sì, è chiaro. **Questa chat è il punto di decisione e controllo della qualità di LingoCoon.** Il lavoro operativo avviene nelle altre chat tramite prompt completi che preparo io. Tu leggi, approvi, incolli il prompt e provi il risultato.

Correggo quindi la mia interpretazione precedente: qui gestisco priorità, requisiti, confini del lavoro e accettazione; non avvio direttamente l’implementazione. Coinvolgiamo soltanto i ruoli utili alla consegna concreta.

L’obiettivo attuale è **un reader Context Studio realmente utile e curato**, con comprensione contestuale affidabile e lettura fluida. Il prototipo esistente è una base da migliorare, non una funzionalità già accettata.

**Possiamo iniziare senza riorganizzare tutto.** Prima della prima consegna operativa servono soltanto:

- Un perimetro approvato con comportamenti e criteri di qualità osservabili.
- I riferimenti visivi accessibili alla chat esecutrice.
- Un percorso di verifica nel browser tramite normale autenticazione: il tuo test finale deve seguire le verifiche dell’esecutore, non sostituirle.

Nel prompt operativo includerò questi elementi, i file autorizzati, le modifiche da preservare e le prove richieste. Eventuali blocchi dovranno essere dichiarati; test e compilazione da soli non basteranno per dichiarare il lavoro concluso.

Il prossimo passo è concordare la prima consegna del reader e preparare **un unico prompt pronto da incollare nella chat di sviluppo**. Non serve riaprire la roadmap o attivare tutti i reparti.

> ogni volta nel prompt devi specificare di consultare agents skills ecc e come fare il lavoro, non un semplice scrittore di codice. Le chat sono suddivisi, sono come una squadra devi capire a chi meglio dare il lavoro e in che modo

Chiaro. **Ogni prompt sarà un incarico professionale completo**, assegnato alla chat più adatta, con responsabilità sul risultato e sulla verifica.

Includerò sempre:

- **Ruolo e responsabilità:** chi esegue, quale risultato deve consegnare e quali decisioni può prendere.
- **Letture obbligatorie:** `AGENTS.md`, `.agents/project/AGENTS.md`, `.agents/README.md` e documenti autorevoli pertinenti.
- **Skill specifiche:** nomi espliciti con `$skill-name`, lettura completa dei rispettivi `SKILL.md` e conferma di caricamento. Solo quelle necessarie.
- **Metodo:** ispezionare lo stato attuale, preservare modifiche esistenti, motivare le scelte, implementare e verificare il comportamento reale.
- **Confini:** file autorizzati, esclusioni, vincoli di sicurezza, privacy e budget.
- **Accettazione e restituzione:** prove richieste, problemi irrisolti e aggiornamento del documento condiviso per riportare qui un risultato valutabile.

**Io scelgo a chi affidare il lavoro e riconcilio i risultati.** Tu non devi coordinare gli specialisti né ricostruire i loro ragionamenti.

Per la prossima slice di Context Studio, affiderei la consegna alla **chat Fullstack Engineer**, perché coinvolge interfaccia, identità della selezione e contratto server. Una successiva verifica circoscritta alla **chat QA** controllerà interazioni e prove. UX interviene prima dell’implementazione soltanto sulle decisioni ancora irrisolte, senza riaprire tutta la progettazione.

> adesso lavoriamo su context page per la lettura immersa, ora è scomodissimo, e poi cliccando mi mostra la traduzione in inglese se il testo è in inglese!!! anche se la lingua madre è ita deve quindi mostrare in ita ma questo è solo piccola parte di cosa bisogna sistemare

**La priorità è rendere comoda la lettura immersiva e affidabile l’aiuto contestuale.** La traduzione inglese→inglese, con lingua madre italiana, è un difetto funzionale: traduzione e spiegazione devono rispettare la lingua madre; il testo originale deve rimanere nella lingua che stai leggendo.

Non approverei ancora un intervento limitato al layout. Dobbiamo verificare insieme tre aspetti:

- **Lettura:** spazio dedicato al testo, tipografia, distrazioni, posizione di lettura e comportamento su mobile.
- **Selezione:** un clic sulla parola o selezione di una frase, significato subito vicino e dettagli senza perdere il punto.
- **Lingue:** origine della lingua madre, lingua effettiva del testo, richiesta AI e cache. Il risultato deve distinguere anche occorrenze uguali con significati diversi.

**Il primo incarico lo darei alla chat UX/UI**, con ispezione del reader attuale nel browser e una proposta concreta desktop/mobile. Deve produrre un unico flusso pronto da implementare, includendo caricamento, errori, tastiera e recupero della lettura. Alla chat Fullstack affideremo poi l’intera implementazione, compresa la correzione linguistica; QA verificherà il risultato.

Per evitare un’altra proposta astratta, serve partire dalla pagina che stai usando: **stai provando Context Studio in locale oppure sul sito pubblicato, e a quale URL?**

> si da locale

Perfetto. Partiamo dalla versione locale. **Il prossimo incarico va alla chat UX/UI Designer:** deve osservare il reader reale e definire la correzione dell’esperienza. Il problema delle lingue va incluso come requisito bloccante per la successiva implementazione Fullstack.

Incolla questo prompt:

```text
Act as LingoCoon’s UX/UI designer for one bounded Context Studio reader review. Treat LingoCoon as a serious public product. Own the quality of the interaction specification and its handoff to implementation.

This task authorizes read-only repository and local-browser inspection, plus a proposal in your response. Do not edit files, implement code, create tasks, spawn agents, change dependencies or remote settings, deploy, or incur costs.

Required startup
1. Read AGENTS.md, .agents/project/AGENTS.md, and .agents/README.md completely.
2. Read docs/product/context-studio.md, docs/agents/chat-starters.md, docs/design/ux-principles.md, and docs/design/visual-system.md.
3. Load $lingocoon-ux, $lingocoon-minimal, and $browser-e2e-validation. Read each SKILL.md completely and confirm which skills you loaded. Follow required references; do not run unrelated skills.
4. Check the current Git branch, status, relevant changes, and untracked files. Preserve all existing work.
5. Inspect the current reader implementation and its relevant language/data flow. Use current source and authoritative documents, not entire previous task histories.

Problem
The owner finds the local Context Studio reader very uncomfortable to use. Selecting English text reportedly returns English translation even though the learner’s native language is Italian. This is a reported defect to reproduce and investigate, not a verified diagnosis.

The intended experience is immersive, reading-first contextual learning:
- Import/edit is separate from reading.
- The source is visually dominant and comfortable to read.
- A single click looks up a word; native selection looks up a phrase.
- Selection identifies the exact source occurrence, including repeated words.
- Concise contextual help appears near the selection.
- Deeper details remain accessible without losing reading position.
- Translation and explanatory prose use the learner’s native language; source quotations and target-language examples remain clearly distinguished.
- The actual source language must not be blindly inferred from the profile’s target language.
- Optional bilingual display aligns source sentences with their translations.
- Desktop, mobile, keyboard, loading, error, retry, and focus restoration are part of the core flow.
- Focus phrases support future active use; flashcards are not the primary experience.

Inspection method
Find the existing local reader URL and running server through available non-secret evidence. If unavailable, report the exact blocker and request only the missing information. Use normal authentication. Never bypass login, read secrets, or copy session tokens.

Inspect the rendered application at desktop and narrow widths, including 320px. Exercise reading, word lookup, phrase selection, details, translation display, and returning to the text where available. Distinguish browser observations, source findings, owner reports, and proposals.

Use synthetic text containing repeated “bank” occurrences with different meanings, long sentences, and multiple paragraphs. Do not send private learner content to providers. Do not fabricate AI results or interpret mocked behavior as live-provider evidence.

Reuse available Readlang and Language Reactor reference material. If the actual references are missing, state this explicitly; do not claim a visual comparison based only on their names. Avoid a broad competitor study or a new product roadmap.

Required result
Produce one concise, implementation-ready recommendation:
1. The most consequential observed problems, with reproduction steps or source evidence.
2. One concrete desktop/mobile interaction specification: reading area, nearby help, detail panel, bilingual display, and edit/return flow.
3. A behavior table covering selection, language rules, loading, errors/retry, dismissal, keyboard, and reading-position preservation.
4. Observable acceptance criteria and a bounded proposed implementation file set for Fullstack.
5. Remaining blockers or decisions requiring the owner, with your recommended default.

Include screenshots of the actual inspected UI when available. Explain how each proposed change improves reading. Do not stop at generic advice such as “improve spacing” or “make it responsive.”

Keep the handoff self-contained so the decision-making task can approve it without retrieving your history. Communicate concisely in Italian; use professional English for technical specifications and identifiers. Do not claim the feature is ready or verified if authentication or another blocker prevents inspecting its critical flow.
```

Quando riporti qui il risultato, definisco il perimetro da approvare e preparo il prompt Fullstack per la consegna completa.

> ok non ho questa chat quidni scrivi prima prompt per inserire prima in questo chat

Crea una chat nel progetto **LingoCoon** e incolla prima questo prompt per impostarla. Poi incolla l’incarico di revisione che ti ho preparato.

```text
Act as LingoCoon’s dedicated UX/UI Designer. You are responsible for learner experience, interaction design, information architecture, accessibility, and visual consistency.

You work within a team coordinated by the main decision-making chat. Your role is to turn assigned product problems into concrete, evidence-backed designs that an engineer can implement and QA can verify. Treat LingoCoon as a serious public language-learning product.

Startup
1. Read AGENTS.md, .agents/project/AGENTS.md, and .agents/README.md completely.
2. Read docs/agents/chat-starters.md and the relevant role entry in docs/agents/agent-directory.md.
3. Load $lingocoon-ux and $lingocoon-minimal by reading their SKILL.md files completely, including required references. Confirm which skills you loaded.
4. For each assignment, read its authoritative feature document and inspect the relevant current implementation and Git status.
5. Load additional narrow skills only when the assignment requires them. For local browser validation, load $browser-e2e-validation.

Responsibilities
- Understand the learner’s objective before designing.
- Inspect the actual rendered experience when accessible.
- Design complete flows, including desktop/mobile, keyboard, focus, loading, empty, error, retry, and unavailable-service states.
- Make the learning content primary and supporting controls unobtrusive.
- Reuse the approved visual system and existing components.
- Explain important choices through learner impact and realistic tradeoffs.
- Produce precise behavior specifications, observable acceptance criteria, and a bounded implementation handoff.
- Distinguish observed defects, source findings, assumptions, proposals, and unverified behavior.

Working boundaries
Default to read-only inspection and proposals. Do not edit code, documentation, configuration, or data without explicit assignment-specific approval. Do not commit, push, deploy, change dependencies or remote services, or introduce costs.

Preserve existing uncommitted changes. Never bypass authentication, access secrets, copy session tokens, or invent provider results. Do not create other tasks, contact other chats, or spawn agents unless explicitly requested.

Coordination
The main chat owns priorities, scope approval, and final acceptance. You own the quality and completeness of your UX recommendation. Raise material contradictions with a recommended resolution; do not restart the roadmap or expand scope silently.

Return self-contained handoffs with:
- inspected scope and evidence;
- prioritized findings;
- recommended interaction design;
- acceptance criteria;
- implementation implications;
- unresolved decisions and blockers.

Use concise Italian when communicating with the owner and professional English for technical artifacts. Avoid generic design advice and long reports.

For this initial message, complete only the startup readings and confirm your role, loaded skills, and operating boundaries. Wait for the concrete assignment before reviewing or redesigning a feature.
```

> \
> Scegli un testo che ti interessa.
>
> # Context Studio
>
> 153 parole · sessione temporanea
>
> **Nascondi traduzioneModifica testo**
>
> **Spazio di lettura**
>
> ## Leggi per comprendere
>
> Seleziona una parola o una frase utile
>
> Learning a language becomes easier when the words belong to a real situation. Imagine that you have just joined a new team and a colleague asks what you are working on. You could give a short answer, but a useful conversation needs more than isolated vocabulary. You need to explain your goal, connect ideas, and react to the other person.
>
> This is why reading can become active practice. Notice how each phrase works inside the paragraph. Select an expression that feels useful or unfamiliar, inspect the sentence around it, and save only the phrases that you genuinely want to use. Then say the idea aloud in your own words.
>
> The objective is not to memorize every sentence. It is to understand the message, recognize reusable patterns, and become confident enough to express a similar idea in a new context. Small choices made while reading can guide the next listening, writing, and speaking activities.
>
> Imparare una lingua diventa più facile quando le parole appartengono a una situazione reale. Immagina di essere appena entrato in un nuovo team e che un collega ti chieda a cosa stai lavorando. Potresti dare una risposta breve, ma una conversazione utile richiede più di un vocabolario isolato. Devi spiegare il tuo obiettivo, collegare le idee e reagire all'altra persona.
>
> Ecco perché la lettura può diventare una pratica attiva. Nota come funziona ogni frase all'interno del paragrafo. Seleziona un'espressione che ti sembra utile o non familiare, esamina la frase che la circonda e salva solo le frasi che desideri davvero usare. Poi pronuncia l'idea ad alta voce con parole tue.
>
> L'obiettivo non è memorizzare ogni frase. È comprendere il messaggio, riconoscere modelli riutilizzabili e acquisire abbastanza sicurezza per esprimere un'idea simile in un nuovo contesto. Piccole scelte fatte durante la lettura possono guidare le successive attività di ascolto, scrittura e conversazione.
>
> ## Spiegazione
>
> In questo contesto
>
> **Espressione selezionata**
>
> ### colleague
>
> **collègue · noun**
>
> **Frase originale**
>
> > Imagine that you have just joined a new team and a colleague asks what you are working on.
>
> **Significato nel contesto**
>
> persona con cui si lavora nello stesso ufficio o nella stessa azienda
>
> **Uso**
>
> noun, masculine or feminine (un/une collègue)
>
> **Un altro esempio**
>
> Mon nouveau collègue m'a aidé à installer le logiciel.
>
> Il mio nuovo collega mi ha aiutato a installare il software.
>
> **Aggiungi alle espressioni da praticare**
>
> **Ricerca da tastiera**
>
> **Cerca**
>
> ## Espressioni da praticare
>
> 0/3
>
> Salva fino a tre espressioni da riutilizzare dopo la lettura.
>
> non ha risolto niente tutto confuso 3 lingue insieme mischiate ecc disastro totale. Deve continuare a fare finche non sarà tutto apposto non è affatto come deve essere&#x20;
>
> guarda un po' gli screenshot come deve essere tutto si vede bene sezioni divisi tutto chiaro basta navigare la parola e si vede tutto cliccando player vicino il testo leggerà il testo così deve essere
>
> User context
>
> Images:
> - `/var/folders/y7/781q46jx69q12qlqn3n5hr_80000gn/T/codex-clipboard-e9e04bdb-ea94-4c95-a59d-0e568dcb08ce.png`
> - `/var/folders/y7/781q46jx69q12qlqn3n5hr_80000gn/T/codex-clipboard-3b926c50-966e-4b5a-a197-8e2f25a69015.png`
> - `/var/folders/y7/781q46jx69q12qlqn3n5hr_80000gn/T/codex-clipboard-facf07f2-90a9-4b1f-8ced-5ea30d48ce55.png`

**Il risultato che hai riportato non soddisfa i requisiti.** “Colleague” diventa “collègue”, con grammatica ed esempio francesi: non è soltanto confusione visiva, è un errore nel contesto linguistico. La causa va verificata nel codice.

Negli screenshot il riferimento è concreto: **segmenti originali e tradotti affiancati, significato vicino alla parola, approfondimento separato e player accanto al testo.** Le immagini mostrano la disposizione dei controlli; il loro funzionamento va riprodotto e verificato.

Questo lavoro ora va alla **chat Fullstack Engineer**, perché una revisione UX da sola non corregge comportamento, richieste AI e audio. Incolla questo prompt e allega gli stessi screenshot:

```text
Act as LingoCoon’s Fullstack Engineer and sole implementation owner for the Context Studio immersive reader repair. Own the complete user experience, implementation, and verification.

The owner rejects the current result as confusing and functionally incorrect. This is a continuation of the reader delivery, not a new roadmap or another planning-only exercise.

Authorization
Implement the local Context Studio repair described below. You may modify Context Studio components, dedicated utilities, types, server actions, AI schemas/prompts, relevant localization entries, dedicated tests, and docs/product/context-studio.md.

Preserve all existing unrelated changes. Do not commit, push, change dependencies, modify remote services/database settings, deploy, introduce costs, or implement durable AI/TTS/STT quotas. Do not create tasks or spawn agents.

Required startup
1. Read AGENTS.md, .agents/project/AGENTS.md, and .agents/README.md completely.
2. Read docs/product/context-studio.md, docs/agents/chat-starters.md, relevant design documents, and docs/engineering/test-strategy.md.
3. Load and read completely:
   $feature-delivery
   $lingocoon-engineering
   $lingocoon-ux
   $lingocoon-minimal
   $browser-e2e-validation
   $post-change-quality-gate
   Load $ai-abuse-and-cost-review for the audio/provider boundary.
   Confirm loaded skills; follow their required references without running unrelated workflows.
4. Inspect the current branch, Git status, relevant diffs, and untracked files. Never assume previous work is disposable.
5. Read the relevant installed Next.js documentation before changing framework code.
6. Inspect the attached screenshots. They define the requested interaction hierarchy; do not copy branding or unrelated features.

Before editing, briefly state the implementation boundary and acceptance criteria. This prompt authorizes the described local work; do not request approval again for routine implementation choices within it.

Confirmed owner report
With English source text and Italian native language:
- Full-text translation appears in Italian.
- Selecting “colleague” produces “collègue”.
- Grammar describes French usage.
- The example is French, with an Italian translation.

Reproduce this where possible. Determine the actual cause across profile language resolution, source language, action inputs, prompts, response handling, and cache keys. Do not claim a cause without evidence or patch only the displayed label.

Required experience

A. Immersive reading
- Keep import/edit separate from reading.
- Use a compact toolbar and a dominant, comfortably sized reading area.
- In bilingual mode, render original and translation as paired sentence/meaning units with stable source identities.
- Preserve paragraph grouping and source punctuation.
- Do not align independently generated arrays merely by index or display two unrelated text columns.
- On narrow screens, place each translation directly beneath its corresponding source unit.
- Allow translation to be hidden without losing the reading position.
- Make source and translation languages visible and understandable.

B. Word and phrase interaction
- Single-click word lookup, native phrase selection, and keyboard equivalents.
- Preserve exact source offsets through UI state, server validation, cache, and saved focus references.
- Repeated words with different contexts must remain distinct.
- Show a compact contextual meaning near the selected word; keep the selection visible.
- Provide deeper details in a clearly organized, dismissible desktop panel and usable mobile equivalent.
- Separate meaning, usage/grammar, and examples.
- Closing details must restore focus and preserve reading position.
- Hover may offer equivalent help, but must not be the only access method or generate uncontrolled requests.

C. Correct languages
For English source and Italian native language:
- Selected source word: English.
- Translation, explanation, and grammar prose: Italian.
- New example: English, with an Italian translation.
- Audio: English.
- No unexplained French content.

The profile’s target language is not proof of the imported text’s language. Establish one consistent session language contract, with a clear correction mechanism when necessary. Missing/ambiguous settings must not silently select an unrelated language.

Invalidate incompatible cached results when source, occurrence, or relevant language settings change. Test the reported case even when the profile target language is French.

D. Real audio
- Add a working play control next to the source unit to read that unit.
- Provide whole-text playback with pause/resume and stop where supported.
- Clearly indicate the active unit; prevent overlapping playback.
- Stop or invalidate playback appropriately when editing/resetting or leaving the reader.
- Use the actual source language.
- Keep within zero budget and existing authorization. Assess available browser/device speech capabilities before considering provider changes.
- Handle unavailable voices and playback failures honestly, with a clear fallback. Never present a decorative or nonfunctional player as completed audio.
- Do not claim offline execution or provider privacy properties without verifying them.

E. Recovery and quality
- Reading must remain possible while translation or explanation loads or fails.
- Provide explicit retry.
- Rapid selection changes, cache hits, reset, editing, and unmount must not expose stale results or stuck loading states.
- Keep controls reachable at 320px and with keyboard/zoom.
- Keep focus phrases secondary to reading.
- Use the LingoCoon visual system while reproducing the references’ clear hierarchy.

Verification
Test shipped implementation, not copied fixture logic.

Include:
1. English source + Italian native language + French profile target language.
2. “Colleague”: English source/example, Italian translation/explanation.
3. Repeated “bank” occurrences with different meanings.
4. Word click, phrase selection, keyboard navigation, dismissal, and return to source.
5. Correct bilingual pairing with long sentences and multiple paragraphs.
6. Rapid switching, delayed/out-of-order responses, failures, retry, edit, and reset.
7. Sentence audio and whole-text controls, language selection, no overlap, and unavailable-voice behavior.
8. Rendered desktop and 320px comparison against the attached references.
9. Relevant tests, lint, TypeScript, build, and diff checks.

Use normal local authentication. Do not bypass login, read secrets, copy tokens, or fabricate provider responses. Keep mocked component/browser evidence separate from authenticated application and live AI/audio evidence.

Iterate on defects revealed by these checks within the approved scope. Do not stop at the first successful build or transfer ordinary debugging to the owner. If an external blocker prevents a critical check, complete independent work, document the blocker precisely, and request only the necessary user action.

Delivery
Update docs/product/context-studio.md with accepted scope, ownership, changed files, current evidence, blockers, and next action. Do not mark the reader accepted on behalf of the owner.

Return a concise Italian handoff:
- what changed;
- what was verified, failed, or remains unverified;
- desktop/mobile screenshots of the actual result;
- exact local URL, required flags, and authentication steps;
- a short reproducible owner test;
- remaining acceptance blockers.

Use professional English for code and repository artifacts.
```

**Il tuo controllo finale deve valutare un risultato già verificato dall’esecutore.** Se ricompaiono lingue sbagliate, allineamenti errati o controlli inutilizzabili, la consegna resta aperta.
