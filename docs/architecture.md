# Architecture

Paperlight is a Chrome MV3 extension that surfaces an AI assistant alongside
research-paper PDFs. This document is the high-level blueprint; details
evolve per STEP commit.

## Surfaces

| Surface         | File                       | Responsibility                                |
| --------------- | -------------------------- | --------------------------------------------- |
| Service worker  | `src/background/index.ts`  | Lifecycle, commands, context menus, side panel|
| Content script  | `src/content/index.ts`     | Selection detection, floating menu injection  |
| Side panel      | `src/sidepanel/`           | Chat / explain / highlights / settings UI     |
| Custom viewer   | `src/viewer/`              | pdf.js renderer for `file://` PDFs            |
| Options page    | `src/options/`             | API keys, provider, language, model           |

## Messaging

```
content ──(selection events, pdf-detected)──▶ background ──(broadcast)──▶ sidepanel
sidepanel ──(ai-request)──▶ background ──(invoke provider)──▶ AI API
```

All cross-surface communication goes through `chrome.runtime.sendMessage`,
keyed by typed `paperlight:*` discriminators. Each handler returns `true`
to keep the message port open for async responses.

## AI provider abstraction

`src/ai/` exposes a single `AIProvider` interface:

```ts
interface AIProvider {
  id: 'openai' | 'anthropic' | 'gemini';
  chat(input: ChatInput, opts: ChatOptions): Promise<ChatResult>;
  stream(input: ChatInput, opts: ChatOptions): AsyncIterable<string>;
}
```

Implementations live as `OpenAIProvider`, `AnthropicProvider`,
`GeminiProvider`. A registry in `src/ai/registry.ts` picks the active
provider from user settings; prompt templates are isolated in
`src/ai/prompts/` so adding a new intent (e.g. *critique*) is a one-file
change.

## State

- **Ephemeral** — Zustand stores in `src/core/store/`
  (chat thread, current document, selection, UI mode).
- **Per-document** — IndexedDB (`src/core/storage/db.ts`)
  for highlights, notes, parsed pages, embeddings.
- **Global preferences** — `chrome.storage.local`
  (API keys, default provider, language, theme).

## PDF pipeline

```
arrayBuffer → pdfjs.getDocument() → pages[]
  → page.getTextContent() → normalize whitespace, drop figure captions
  → chunked into "sections" by heading heuristics
  → indexed for context retrieval in chat
```

The viewer renders each page to a canvas + a transparent text layer
(spans positioned with pdf.js transforms) so native browser selection
still works for the floating menu.

## Build & packaging

- `vite + @crxjs/vite-plugin` reads `src/manifest.ts` at build time and
  emits a fully-wired `dist/manifest.json` with hashed asset paths.
- `scripts/copy-pdf-worker.mjs` copies `pdf.worker.min.mjs` into
  `public/` before each build so it's available as a
  `web_accessible_resource`.
- `scripts/zip.mjs` produces a Web Store-ready archive.

## Security model

- API keys never leave `chrome.storage.local`. The service worker reads
  them at request time and calls AI APIs directly (no Paperlight server).
- `host_permissions: <all_urls>` is required for content scripts to run on
  arbitrary PDF hosts; we intentionally avoid `cookies` and `webRequest`
  permissions.
- Markdown rendered in the side panel is sanitised before insertion (no
  raw HTML passthrough).
