# Natalie Suleyman MP — Chatbot Demo

A small Next.js demo site featuring a floating AI chatbot that answers questions about The Hon. Natalie Suleyman MP by retrieving content from her official website ([nataliesuleyman.com.au](https://www.nataliesuleyman.com.au)) using Google's Gemini API with the `url_context` and `google_search` tools.

> **Demo only** — this project is a technical demonstration and is not affiliated with or authorised by Natalie Suleyman or her office. AI-generated answers may contain errors.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS
- `@google/genai` (Gemini 2.5 Flash with `url_context` + `google_search` tools)

## Local development

```bash
# 1. install
npm install

# 2. configure env
cp .env.example .env.local
# then edit .env.local and set GEMINI_API_KEY=...

# 3. run dev server
npm run dev
```

Open http://localhost:3000 and click the chat bubble in the bottom-right corner.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, **New Project → Import** the repo.
3. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` — your Google AI Studio API key (https://aistudio.google.com/apikey).
4. Click **Deploy**. No other configuration is needed — Vercel auto-detects Next.js.

The `/api/chat` route is a standard Node.js serverless function (`runtime = "nodejs"`, `maxDuration = 60`).

## Project layout

```
app/
  api/chat/route.ts     # POST /api/chat — calls Gemini with url_context + google_search
  layout.tsx            # mounts the floating ChatBubble globally
  page.tsx              # landing page
  globals.css
components/
  ChatBubble.tsx        # floating bubble + expandable chat panel
lib/
  system-prompt.ts      # Natalie-specific system instruction
public/
  background.png
```

## Tweaking the assistant

Edit [`lib/system-prompt.ts`](lib/system-prompt.ts) to update the system instruction, knowledge-base facts, or guardrails. The model and tool configuration live in [`app/api/chat/route.ts`](app/api/chat/route.ts).
