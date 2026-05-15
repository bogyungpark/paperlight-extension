# Paperlight Roadmap

## Phase 1 — MVP (required)

- [x] **STEP 1** — Vite + React + TS + Tailwind scaffolding, MV3 manifest, build pipeline
- [ ] **STEP 2** — pdf.js viewer, text extraction, page parsing
- [ ] **STEP 3** — Selection detection + floating menu wired to side panel
- [ ] **STEP 4** — AI provider abstraction (OpenAI first) + explain / summarize / translate / chat
- [ ] **STEP 5** — Highlights & notes with IndexedDB persistence

## Phase 2 — Stabilization

- [ ] **STEP 6** — Citation hover previews via Semantic Scholar
- [ ] **STEP 7** — UI polish: animations, keyboard shortcuts, responsive density, dark mode toggle
- [ ] **STEP 8** — Production packaging, README screenshots, release build, install guide

## Phase 3 — Advanced

- [ ] Figure / table / equation explanation (multimodal — Claude Sonnet + GPT-4o vision)
- [ ] Related paper recommendation (Semantic Scholar relevance API)
- [ ] Cross-device sync via `chrome.storage.sync` (with size budget)
- [ ] Collaborative notes (Yjs + WebRTC)
- [ ] Semantic search across the user's read papers (local embeddings)

## Known issues

- pdf.js worker is large (~1.4 MB) and ships with every build — acceptable for MVP.
- `host_permissions: <all_urls>` requires Chrome Web Store justification — to be documented in STEP 8.
- Side panel API is Chrome-only; Firefox port deferred until extension is stable.
