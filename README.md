# Paperlight

> AI-powered research paper reader, built as a Chrome Extension (Manifest V3).
>
> Inspired by [themoonlight.io](https://www.themoonlight.io/ko) — same UX flow
> (open PDF → side panel → AI on selection), rebuilt from scratch as a clean,
> modern SaaS-style codebase.

[![CI](https://github.com/bogyungpark/paperlight-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/bogyungpark/paperlight-extension/actions/workflows/ci.yml)
![mv3](https://img.shields.io/badge/manifest-v3-3b82f6)
![license](https://img.shields.io/badge/license-MIT-22c55e)
![version](https://img.shields.io/badge/version-1.0.0-6366f1)

---

## What it does

- 🔍 Detects PDF research papers in Chrome and unlocks an AI side panel
- 📄 Renders the PDF inline (pdf.js) with selectable text
- ✨ Highlight any text → floating menu: **Explain · Translate · Summarize · Ask AI · 4 highlight colors**
- 🧵 Chat with the paper — context-aware QA grounded in the parsed paper text
- 🏷️ Highlights + notes saved locally (IndexedDB), survive re-opens via PDF hash
- 🔗 Citation hover previews — arXiv IDs, DOIs, `(Smith et al., 2024)` style — via Semantic Scholar
- 🌓 Modern, minimal SaaS UI (system / dark / light theme, glassmorphism, Linear/Notion-style density)
- ⌨️ Keyboard-driven: `j`/`k` page nav, `[`/`]` zoom, `/` outline, ⌘⇧L toggle, ⌘⇧E explain

## Screens

| Side panel chat | Viewer with floating menu | Highlights tab |
| --------------- | ------------------------- | -------------- |
| _(add screenshot)_ | _(add screenshot)_ | _(add screenshot)_ |

> Screenshots are added during release packaging. Open `dist/` in Chrome to preview locally.

## Tech stack

| Area          | Tooling                                                  |
| ------------- | -------------------------------------------------------- |
| Build         | Vite 5 + `@crxjs/vite-plugin`                            |
| Framework     | React 18 + TypeScript (strict)                           |
| Styling       | TailwindCSS + custom design tokens                       |
| State         | Zustand                                                  |
| PDF           | pdf.js v4 (`pdfjs-dist`)                                 |
| AI providers  | OpenAI · Anthropic · Gemini (pluggable abstraction)      |
| Storage       | `chrome.storage.local` + IndexedDB                       |
| Surfaces      | side panel · content script · viewer page · options page |

## Install

```bash
git clone https://github.com/bogyungpark/paperlight-extension.git
cd paperlight-extension
npm install
npm run build
```

Then in Chrome → `chrome://extensions` → toggle **Developer mode** → **Load unpacked** → select the `dist/` folder.
Full setup steps in [docs/INSTALL.md](./docs/INSTALL.md).

### Configure your API key

Open the side panel → ⚙️ Settings → paste your key. Keys live in
`chrome.storage.local` and never leave your browser except to call the
provider you chose. Privacy details in [docs/PRIVACY.md](./docs/PRIVACY.md).

### Development

```bash
npm run dev       # HMR for side panel UI (use a clean Chrome profile while developing)
npm run typecheck
npm run lint
npm run build     # production bundle in dist/
npm run zip       # paperlight-extension-<version>.zip for Chrome Web Store
```

## Keyboard shortcuts

| Action               | macOS   | Windows / Linux |
| -------------------- | ------- | --------------- |
| Toggle side panel    | ⌘⇧L     | Ctrl+Shift+L    |
| Explain selection    | ⌘⇧E     | Ctrl+Shift+E    |
| Next / previous page | j / k or ↓ / ↑ | same    |
| Zoom in / out / reset | + / − / 0 (also `]` / `[`) | same |
| Toggle outline       | `/`     | same            |

When in viewer; shortcuts auto-disable inside text fields.

## Architecture

```
src/
├─ background/      # MV3 service worker — context menus, commands, side panel routing
├─ content/         # Content script — Shadow DOM selection menu on any page
├─ sidepanel/       # React UI for the side panel (Chat / Highlights tabs)
├─ viewer/          # Custom PDF viewer (pdf.js + highlight overlay + citation hover)
├─ options/         # Options page (provider, keys, models, language, theme)
├─ ai/              # Provider abstraction (OpenAI · Anthropic · Gemini) + SSE + prompts
├─ pdf/             # PDF loader, text extraction, section inference
├─ core/            # Stores (chat, document, highlight, settings), storage (IndexedDB), messaging, citations
├─ ui/              # Reusable design-system components + hooks (useTheme, useTextSelection)
└─ assets/          # Icons
```

Deeper notes in [docs/architecture.md](./docs/architecture.md).
A live status of every implemented STEP is tracked in [docs/PROGRESS.md](./docs/PROGRESS.md).

## Roadmap

- [x] STEP 1 — Project scaffolding + build pipeline
- [x] STEP 2 — PDF viewer + text extraction
- [x] STEP 3 — Selection popup + side panel wiring
- [x] STEP 4 — AI provider layer + explain/summarize/translate/chat (streaming)
- [x] STEP 5 — Highlights + notes (IndexedDB, 4 colors)
- [x] STEP 6 — Citation hover previews (Semantic Scholar)
- [x] STEP 7 — UI polish (theme, keyboard shortcuts, empty-state guidance)
- [x] STEP 8 — Production packaging (CI, version 1.0.0, docs)
- [ ] Figure/table/equation explanation (multimodal)
- [ ] Related paper recommendations
- [ ] Cross-device sync
- [ ] Collaborative notes
- [ ] Semantic search across read papers

## Contributing

Issues and PRs are welcome — see [docs/architecture.md](./docs/architecture.md) for the design vocabulary used throughout the codebase.

## License

MIT © 2026 Paperlight contributors
