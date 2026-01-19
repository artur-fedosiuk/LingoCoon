# 🏗️ Database Architecture & Schema Documentation

> **Status:** Core Milestone Complete  
> **Last Updated:** January 2026  
> **Migration:** "Destructive Reset" (Clean Slate)

This document outlines the database foundation for the Flashcards application. It explains the relationships between data entities, the logic behind the Spaced Repetition System (SRS), and the security measures in place.

---

## 🧠 Mental Model (Entity Relationship)

Our database is built on **PostgreSQL** (via Supabase). The relationships are designed to keep user data isolated and data integrity high.

### The Hierarchy
1.  **👤 User (`auth.users`)**: The root of all data. Uses Supabase Auth.
2.  **📚 Deck (`public.decks`)**: A collection of flashcards owned by a user.
    *   *Relationship:* One User has many Decks.
3.  **🃏 Card (`public.cards`)**: An individual flashcard inside a deck.
    *   *Relationship:* One Deck has many Cards.
4.  **📈 Study Progress (`public.study_progress`)**: The "brain" that tracks how well a user knows a specific card.
    *   *Relationship:* One Card has one Study Progress entry per User.

---

## 📅 The "Brains": Spaced Repetition System (SRS)

The `study_progress` table is the engine of our "Study Mode". It implements a standard Spaced Repetition algorithm (likely similar to SM-2).

### Key Columns Explained
*   **`ease_factor` (Decimal)**: A multiplier that determines how fast the intervals grow.
    *   *Default:* 2.5
    *   *Logic:* Harder cards have a lower factor (intervals grow slowly). Easy cards have a high factor (intervals grow fast).
*   **`interval` (Integer)**: The number of days until the *next* review.
    *   *Example:* An interval of `3` means "show this card again in 3 days".
*   **`next_review` (Timestamp)**: The exact date/time when the card becomes "Due".
    *   *Usage:* The "Study Mode" query simply asks: `SELECT * FROM study_progress WHERE next_review <= NOW()`.
*   **`repetitions` (Integer)**: A counter of how many times the card has been successfully reviewed in a row.

---

## 🛡️ Safety Mechanisms

We rely on the database to enforce rules, preventing "bad data" from ever existing.

### 1. Constraints (CHECK)
These are rules that reject invalid inserts:
*   **Languages:** `language_from` and `language_to` columns on Decks likely restrict values to our supported list (e.g., 'en', 'es', 'fr', 'it'), preventing typos like 'eng'.
*   **Content Limits:** `front` and `back` of cards are limited (e.g., 500 chars) to keep the UI clean.
*   **Difficulty:** `difficulty` on Cards is constrained to 1-5.

### 2. Referential Integrity (ON DELETE CASCADE)
This prevents "orphan" data:
*   **Deleting a User** ➡️ Automatically deletes all their **Decks**.
*   **Deleting a Deck** ➡️ Automatically deletes all its **Cards**.
*   **Deleting a Card** ➡️ Automatically deletes its **Study Progress**.

*Why?* You never have to worry about cleaning up "ghost" cards from a deleted deck. The DB handles it.

---

## 🔒 Security Layer (RLS)

We use **Row Level Security (RLS)** to enforce privacy.

*   **The Rule:** A user can *only* see, edit, or delete rows where `user_id` matches their own Authentication ID.
*   **In Practice:**
    *   `SELECT * FROM decks` automatically returns **only my decks**.
    *   Accessing someone else's deck ID returns `404 Not Found` (or empty result), effectively making it invisible.

---

## 🔮 Future-Proofing: `get_deck_stats`

We added a database function (RPC) called `get_deck_stats`.

**Why?**
Calculating "How many cards are due today?" for every single deck on the dashboard would be slow if we fetched all cards into the application layer.

**The Solution:**
This function runs heavily optimized math *inside the database* and returns a lightweight summary:
*   Total Cards
*   New Cards
*   Due Cards (Ready for review)

This ensures the Dashboard loads instantly, even if a user has 10,000 cards.

---

## 📖 Glossary

*   **RLS (Row Level Security):** A PostgreSQL feature that filters data access based on the user logged in. It's like having a personal bouncer for every database row.
*   **SRS (Spaced Repetition System):** A learning technique that schedules reviews at increasing intervals (1 day, 3 days, 1 week) to maximize memory retention.
*   **Cascade:** A database action where deleting a parent record (like a Deck) triggers a "waterfall" deletion of all its children (Cards).
*   **RPC (Remote Procedure Call):** A way to call a database function from the specific frontend client, used here for complex statistics.
