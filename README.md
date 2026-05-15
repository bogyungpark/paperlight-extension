# Paperlight

> AI-powered research paper reader, built as a Chrome Extension (Manifest V3).
>
> Inspired by themoonlight.io — same UX flow (open PDF → side panel → AI on selection),
> rebuilt from scratch as a clean, modern SaaS-style codebase.

![status](https://img.shields.io/badge/status-MVP--in--progress-6366f1)
![mv3](https://img.shields.io/badge/manifest-v3-3b82f6)
![license](https://img.shields.io/badge/license-MIT-22c55e)

---

## What it does

- 🔍 Detects PDF research papers in Chrome and unlocks an AI side panel
- 📄 Renders the PDF inline (pdf.js) with selectable text
- ✨ Highlight any text → floating menu: **Explain · Translate · Summarize · Ask AI**
- 🧵 Chat with the paper — context-aware QA with citation grounding
- 🏷️ Highlights + notes saved locally (IndexedDB)
- 🔗 Citation hover previews (Semantic Scholar)
- 🌓 Modern, minimal SaaS UI (dark mode default, glassmorphism, Linear/Notion-style density)

## Tech stack

| Area          | Tooling                                                  |
| ------------- | -------------------------------------------------------- |
| Build         | Vite + `@crxjs/vite-plugin`                              |
| Framework     | React 18 + TypeScript (strict)                           |
| Styling       | TailwindCSS + custom design tokens                       |
| State         | Zustand                                                  |
| PDF           | pdf.js (`pdfjs-dist`)                                    |
| AI providers  | OpenAI · Anthropic · Gemini (pluggable abstraction)      |
| Storage       | `chrome.storage.local` + IndexedDB                       |
| Surfaces      | side panel · content script · viewer page · options page |

## Quickstart

```bash
git clone https://github.com/bogyungpark/paperlight-extension.git
cd paperlight-extension
npm install
npm run build
```

Then in Chrome:

1. Visit `chrome://extensions`
2. Toggle **Developer mode** (top-right)
3. Click **Load unpacked** → select the `dist/` folder
4. Pin Paperlight from the extensions menu

### Configure your API key

Open the side panel → ⚙️ Settings → paste your key. Keys are stored in
`chrome.storage.local` and never leave your browser except to call the
AI provider you selected.

### Development

```bash
npm run dev       # HMR for side panel UI (separate Chrome profile recommended)
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

## Architecture

```
src/
├─ background/      # MV3 service worker — context menus, commands, side panel
├─ content/         # Content script — selection detection, floating menu
├─ sidepanel/       # React UI for the side panel
├─ viewer/          # Custom PDF viewer page (pdf.js)
├─ options/         # Options page
├─ ai/              # Provider abstraction (OpenAI / Anthropic / Gemini)
├─ pdf/             # PDF text extraction, page indexing
├─ core/            # Stores, types, storage adapters, prompt layer
├─ ui/              # Reusable design-system components
└─ assets/          # Icons, fonts
```

See [docs/architecture.md](./docs/architecture.md) for a deeper dive.

## Roadmap

- [x] STEP 1 — Project scaffolding + build pipeline
- [ ] STEP 2 — PDF viewer + text extraction
- [ ] STEP 3 — Selection popup + side panel wiring
- [ ] STEP 4 — AI provider layer + explain/summarize/translate/chat
- [ ] STEP 5 — Highlights + notes (IndexedDB)
- [ ] STEP 6 — Citation hover previews (Semantic Scholar)
- [ ] STEP 7 — UI polish (animations, keyboard shortcuts, responsive)
- [ ] STEP 8 — Production packaging, README screenshots, release

## License

MIT © 2026 Paperlight
