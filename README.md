# 🦝 LingoCoon

LingoCoon è un'applicazione web per l'apprendimento linguistico basata sull'intelligenza artificiale. Utilizza la ripetizione spaziata (SM-2), la sintesi vocale e la traduzione automatica per aiutare gli utenti a imparare nuove lingue in modo efficace.

🔗 **Live Demo:** [https://lingo-coon.vercel.app](https://lingo-coon.vercel.app)

## Funzionalità Principali

* **Autenticazione:** Login sicuro con Email/Password e Google (Firebase).
* **Flashcard Intelligenti:** Algoritmo SM-2 per ottimizzare i tempi di ripasso.
* **Text-to-Speech:** Ascolta la pronuncia corretta grazie all'integrazione con Google TTS.
* **Traduzione Automatica:** Supporto multilingua immediato.
* **Interfaccia Responsiva:** Ottimizzata per desktop e mobile.

## Stack Tecnologico

* **Frontend:** React 19, Vite
* **Stili:** Tailwind CSS
* **Backend & DB:** Firebase (Auth, Firestore)
* **AI & API:** Google Cloud TTS, Hugging Face, MyMemory Translation
* **CI/CD:** GitHub Actions + Vercel

## Installazione Locale

1.  Clona il repository:
    ```bash
    git clone [https://github.com/ArturRaccoon/LingoCoon.git](https://github.com/ArturRaccoon/LingoCoon.git)
    cd LingoCoon
    ```

2.  Installa le dipendenze:
    ```bash
    npm install
    ```

3.  Configura le variabili d'ambiente:
    * Copia `.env.example` in `.env.local`
    * Inserisci le tue chiavi API in `.env.local`

4.  Avvia il server di sviluppo:
    ```bash
    npm run dev
    ```

## 🛡️ Sicurezza

Questo progetto utilizza variabili d'ambiente per proteggere le chiavi API. Non committare mai il file `.env.local`.

---
*Progetto sviluppato da Artur Fedosyuk*
