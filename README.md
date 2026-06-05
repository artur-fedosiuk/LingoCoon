# lingoCoon

A flashcard-based language learning app built for real learners — not textbook exercises.  
Built with spaced repetition, multilingual support, and efficient review techniques in mind.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS |
| Animations | Framer Motion |
| Backend / DB | Supabase |
| Language | TypeScript (strict) |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
app/           → Pages and layouts (App Router)
components/    → Reusable UI components
lib/           → Supabase client, utilities
types/         → TypeScript types and interfaces
```

---

## Features

- 📇 Flashcard review system
- 🌍 Multi-language support
- ⚡ Spaced repetition (in progress)
- 🎞️ Smooth card animations

---

## Environment Variables

Create a `.env.local` file at the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ELEVENLABS_API_KEY=your_elevenlabs_free_tier_key
GROQ_API_KEY=your_groq_free_tier_key
```

TTS uses verified free ElevenLabs female and male Default voices with `eleven_flash_v2_5`. The free plan
starts with 10,000 credits per month. Eleven v3 currently uses one credit per
input character, so this is roughly 10,000 characters before the monthly quota
resets. Keep pay-as-you-go disabled if you want to avoid charges. ElevenLabs
does not expose Voice Library voices through the API on the free tier, so keep
the configured default voice IDs when using a free account.

Interactive AI chat, structured dictionary responses, and speech input use
Groq. Speech recognition uses Whisper Large V3. Create a free Groq API key at
[console.groq.com/keys](https://console.groq.com/keys), then add it to `.env.local`
as `GROQ_API_KEY`. The key stays on the server. Voice recordings are limited to
20 seconds and are transcribed only after an authenticated user presses the
microphone button.

---

## Contributing

Open to contributions. Fork the repo, create a branch, open a PR.

---

## License

MIT
