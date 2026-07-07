# LingoCoon

A flashcard-based language learning app built for real learners — not textbook exercises.
Built with spaced repetition, multilingual support, and efficient review techniques in mind.

## Live Demo

👉 **[https://lingoccoon.vercel.app](https://lingocoon.vercel.app)**

No installation needed — the app is deployed and fully functional. Just open the link.

---

## Tech Stack

| Layer          | Tech                          |
|----------------|--------------------------------|
| Framework      | Next.js 16 (App Router)        |
| UI             | React 19 + Tailwind CSS        |
| Animations     | Framer Motion                  |
| Backend / DB   | Supabase                       |
| Language       | TypeScript (strict)            |
| Hosting        | Vercel                         |

## Features

- 📇 Flashcard review system
- 🌍 Multi-language support
- 📖 Advanced dictionary with structured lookups
- 💬 AI chat for interactive practice (Groq)
- 🎙️ Speech recognition (Whisper Large V3, via Groq)
- 🔊 Text-to-speech (ElevenLabs)
- 🔐 OAuth 2.0 / JWT authentication with Row Level Security
- ⚡ Spaced repetition (in progress)
- 🎞️ Smooth card animations

---

## Local Development

Only needed if you want to contribute, extend a feature, or run your own instance.
**The public demo above already has everything configured on Vercel — you don't need any of this to use the app.**

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Project Structure

```
app/           → Pages and layouts (App Router)
components/    → Reusable UI components
lib/           → Supabase client, utilities
types/         → TypeScript types and interfaces
```

### Environment Variables

> These variables are required only for local development or if you deploy your own instance.
> They are not needed to use the public demo — that instance already has its own keys set in Vercel.

Create a `.env.local` file at the root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ELEVENLABS_API_KEY=your_elevenlabs_free_tier_key
GROQ_API_KEY=your_groq_free_tier_key
```

**TTS (text-to-speech):** uses verified free ElevenLabs female and male default voices with `eleven_flash_v2_5`. The free plan starts with 10,000 credits/month. `eleven_flash_v2_5` uses roughly one credit per input character, so that's about 10,000 characters before the monthly quota resets. Keep pay-as-you-go **disabled** if you want to avoid charges. On the free tier, ElevenLabs does not expose Voice Library voices through the API — keep the configured default voice IDs if you're on a free account.

**AI chat, dictionary, speech input:** interactive AI chat, structured dictionary responses, and speech-to-text all use Groq. Speech recognition uses Whisper Large V3. Get a free key at [console.groq.com/keys](https://console.groq.com/keys) and add it as `GROQ_API_KEY`. The key stays server-side. Voice recordings are capped at 20 seconds and are only transcribed after an authenticated user presses the microphone button.

---

## Contributing

Open to contributions. Fork the repo, create a branch, open a PR.

## License

MIT
