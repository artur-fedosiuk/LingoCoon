# 00_QUICK_START.md

**Last Updated**: 2026-01-18  
**Author**: Antigravity  
**Project Version**: 0.1.0  

**Prerequisites**: None. This is your starting point.

---

# LinguaCoon - Quick Start Guide

## 📖 Introduction
Welcome to **LinguaCoon**, a modern web application designed for language learning through Flashcards and a Spaced Repetition System (SRS).

This guide is designed to get you from "zero" to a fully running local development environment in under 5 minutes. It explains not just *what* to type, but *why* you are typing it.

### Tech Stack Overview
*   **Next.js 15 (App Router)**: The React framework managing the user interface. We use the updated "App Router" for better performance and server-side features.
*   **Supabase**: Our "Backend-as-a-Service". It provides the PostgreSQL database, Authentication (Login/Signup), and Row Level Security (RLS) to keep data safe.
*   **Tailwind CSS**: A utility-first CSS framework for rapid UI styling.

---

## 🛠️ Prerequisites

Before you start, ensure you have the following software installed. These are required to build and run the application.

1.  **Node.js (v20.x or higher)**
    *   *Why?* This is the runtime environment that executes our JavaScript code outside the browser.
    *   *Check*: Run `node -v` in your terminal.
2.  **npm (v10.x)**
    *   *Why?* The Node Package Manager used to install third-party libraries (like React, Next.js).
    *   *Check*: Run `npm -v` in your terminal.
3.  **Supabase Account**
    *   *Why?* You need a cloud project to host your database. A free tier account is sufficient.
    *   *Action*: Create one at [supabase.com](https://supabase.com).

---

## 🚀 Local Setup Instructions

Follow these steps carefully to launch the project.

### 1. Clone & Navigate
First, get the code onto your machine and move into the project folder.

```bash
# Navigate to the project directory
cd C:\Users\Enotik\Desktop\lingua-flow
```

### 2. Install Dependencies
Download all the libraries listed in `package.json`. This creates a `node_modules` folder.

```bash
npm install
```

> **Note**: This might take a minute depending on your internet connection.

### 3. Environment Configuration
We need to connect your local code to your cloud database. We use environmental variables (hidden secrets) to do this securely.

```bash
# Create your local secrets file by copying the example
cp .env.local.example .env.local
```

**⚠️ CRITICAL STEP**:
Open the newly created `.env.local` file in your editor. You must fill in these two values from your Supabase Project Settings (API Section):

*   `NEXT_PUBLIC_SUPABASE_URL`: The unique web address of your Supabase project.
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The public API key allowing your app to talk to the database.

### 4. Start Development Server
This command builds the application and watches for any changes you make to the code.

```bash
npm run dev
```

### 5. Open in Browser
Once the terminal shows "Ready in [x]ms", open your web browser and go to:
**http://localhost:3000**

---

## ✅ Verification: Is it working?

Don't just run the command—verify the result!

1.  **Browser Check**: You should see the LinguaCoon homepage. It should look styled (not just plain text).
2.  **Console Check**: Look at your terminal (VS Code). It should say `Ready` and typically lists the URL. Ensure there are no red `Error` messages.
3.  **Database Check**:
    *   Click "Login" or "Get Started".
    *   Create a new account (or sign in).
    *   If you are redirected to the Dashboard and can see "My Decks", your database connection is **SUCCESSFUL**.

---

## 👣 First Steps

Now that you are up and running, here is how to use the app as a user would:

1.  **Create a Deck**:
    *   Click the **"New Deck"** button.
    *   *Why?* This tests the `INSERT` permission in the database.
    *   Enter a title (e.g., "Spanish Verbs").
2.  **Add Cards**:
    *   Click on your new deck to open it.
    *   Click **"Add Card"**.
    *   *Why?* This tests the specific relationship between Decks and Cards.
3.  **Check Validation**:
    *   Try entering a card with empty text.
    *   *Why?* You should see an error message. This confirms our validation logic (`src/lib/validation.ts`) is active.

---

## ❓ Troubleshooting

Common issues you might face and how to fix them.

| Error Message | Explanation | Solution |
| :--- | :--- | :--- |
| **`Module not found`** | Your computer is missing a library. | Run `npm install` again to ensure everything downloaded correctly. |
| **`Supabase connection failed`** | The app can't find your database. | Check `.env.local`. Did you paste the URLs correctly without extra properties? |
| **`Auth session missing`** | Your login token expired. | Click "Logout" and log in again. |
| **`500 Internal Server Error`** | Something broke on the server side. | Check the VS Code terminal for the detailed error log. |

---

## 📚 Next Steps

To dive deeper into how this project is built, please read:

1.  **[01_ARCHITECTURE_OVERVIEW.md](01_ARCHITECTURE_OVERVIEW.md)**: A high-level view of how the pieces fit together.
2.  **[04_CORE_WORKFLOWS.md](04_CORE_WORKFLOWS.md)**: Explains the code flow when you click "Create Deck".
