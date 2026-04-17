# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server with Turbopack
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

The Python backend must be run separately:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Architecture Overview

**ZipSure AI** is an EV charging station monitoring dashboard with two server components:

1. **Next.js frontend** (App Router) — pages, API routes, and UI components
2. **FastAPI backend** (`/backend`) — RAG-powered AI chatbot using LangChain + Pinecone + Gemini

In development, `next.config.ts` proxies `/api/py/*` to `http://127.0.0.1:8000/*`. On Vercel, `vercel.json` routes `/python_api/*` to a serverless function wrapper.

## Key Data Flow

**Device telemetry**: Pages read `?device=<id>` from the URL → call `/api/charger_data?device=<id>` → Next.js route fetches from AWS IoT Core (via Lambda/DynamoDB) → raw telemetry is sorted, energy is computed, gaps detected → rendered by Recharts/Plotly.

Device ID mapping: `"1"` → `device1`, `"9"` → `sapna_charger`, `"2"`–`"8"` → `device{n}`.

**AI chat**: `/app/chat/page.js` → `POST /api/chat` (Next.js bridge) → FastAPI `/chatbot` (creates session) + `/ask` (RAG query) → Pinecone vector store filtered by `device_id` + Gemini LLM → response streamed back.

RAG training data lives in `/data/data_2ndmarch.json`.

## App Structure

- `/app` — Next.js App Router pages: `dashboard`, `analytics`, `reports`, `chat`, `payment-plans`, `settings`
- `/app/api` — API route handlers bridging the frontend to AWS and the Python backend
- `/components` — Shared React components; `/components/ui` holds Shadcn/Radix primitives
- `/backend` — FastAPI app (`main.py`) and RAG chain builder (`rag_python.py`)
- `/lib` — Utilities: `pdf-generator.js`, `google.js` (Drive API), `utils.ts` (`cn()` helper)
- `/data` — JSON files used as RAG source documents

## State Management

No global store. All state is local `useState` per page. Device context flows through URL query params (`useSearchParams()`). Data is fetched in `useEffect` and memoized with `useMemo` for filtering.

## Auth

Clerk wraps the entire app in `app/layout.js`. Use `useUser()` and `SignedIn`/`SignedOut` components for auth-gated UI.

## Required Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
GEMINI_API_KEY=
PINECONE_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

## Heavy Dependencies

- `leaflet` / `react-leaflet` — imported with `dynamic(..., { ssr: false })` to avoid SSR issues
- `plotly.js`, `jspdf`, `html2canvas-pro` — transpiled via `next.config.ts` `transpilePackages`
- `@ai-sdk/openai`, `@google/generative-ai` — used in API routes and backend respectively
