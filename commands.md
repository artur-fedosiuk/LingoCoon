# Comandi principali del progetto

Questa guida raccoglie i comandi più importanti da sapere per avviare, controllare e presentare il progetto.

---

## 1. Avviare il progetto

```bash
npm run dev
```

Questo comando avvia l’app in locale.

Di solito poi si apre il progetto nel browser a questo indirizzo:

```text
http://localhost:3000
```

---

## 2. Controllare se il codice TypeScript è corretto

```bash
npx tsc --noEmit
```

Questo comando controlla se ci sono errori TypeScript senza creare file.

Serve per verificare che il codice sia corretto dal punto di vista dei tipi.

---

## 3. Controllare il lint

```bash
npm run lint
```

Questo comando trova problemi di stile o problemi nel codice.

Il lint aiuta a mantenere il codice più ordinato e coerente.

---

## 4. Fare la build finale

```bash
npm run build
```

Questo comando simula la build di produzione.

Se la build passa, significa che il progetto almeno compila correttamente per l’ambiente finale.

---

## 5. Vedere i file modificati

```bash
git status
```

Mostra cosa è cambiato nel progetto.

Versione più compatta:

```bash
git status --short
```

Questo comando è utile per vedere rapidamente quali file sono stati modificati, aggiunti o eliminati.

---

## 6. Vedere le differenze nel codice

```bash
git diff
```

Mostra tutte le modifiche fatte nel codice rispetto all’ultima versione salvata in Git.

Per vedere le modifiche di un file specifico:

```bash
git diff src/lib/server/study-scheduler.ts
```

Questo è utile quando vuoi controllare esattamente cosa è stato cambiato in un file.

---

## 7. Cercare testo nel progetto

```bash
rg "testo-da-cercare"
```

`rg` è come `grep`, ma più veloce.

Esempi:

```bash
rg "rateCard" src
rg "lexicoon" src
rg "NVIDIA"
```

Serve per trovare rapidamente parole, funzioni, componenti o nomi dentro il progetto.

---

## 8. Vedere la struttura dei file

```bash
find src -type f | sort
```

Mostra tutti i file dentro la cartella `src`.

È utile per capire com’è organizzato il progetto.

---

## 9. Installare le dipendenze

```bash
npm install
```

Questo comando installa le dipendenze del progetto.

Va usato soprattutto:

- dopo aver clonato il progetto;
- dopo aver cambiato `package.json`;
- se mancano librerie o pacchetti.

---

## 10. Controllare errori invisibili

Quando `npm run dev` è attivo, bisogna guardare sempre il terminale.

Alcuni errori non appaiono direttamente nel browser, ma compaiono nel terminale.

Questo è importante soprattutto per errori server, API, database o funzioni backend.

---

## 11. Comando di controllo generale

Questo è il comando più importante prima di presentare il progetto:

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Questo comando esegue tre controlli in ordine:

1. controlla TypeScript;
2. controlla il lint;
3. esegue la build di produzione.

Se passa tutto, puoi dire:

> Il progetto compila, passa TypeScript, lint e build di produzione.

---

## 12. Ordine consigliato prima della presentazione

Prima di presentare il progetto, conviene fare questi passaggi:

```bash
git status --short
```

Per vedere se ci sono file modificati.

```bash
npx tsc --noEmit
```

Per controllare TypeScript.

```bash
npm run lint
```

Per controllare lint.

```bash
npm run build
```

Per controllare la build finale.

Oppure si può usare direttamente il comando completo:

```bash
npx tsc --noEmit && npm run lint && npm run build
```

---

## 13. Frase pronta da dire alla presentazione

> Prima della presentazione ho eseguito un controllo generale del progetto.
> Ho verificato TypeScript, lint e build di produzione.
> Se tutti i comandi passano, significa che il progetto compila correttamente e non presenta errori principali visibili.
