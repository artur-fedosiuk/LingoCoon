# 🦝 lingoCoon

A flashcard-based language learning app built for real learners — not textbook exercises.  
Built with spaced repetition, multilingual support, and efficient review techniques in mind.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
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
```

---

## Contributing

Open to contributions. Fork the repo, create a branch, open a PR.

---

## License

MIT
