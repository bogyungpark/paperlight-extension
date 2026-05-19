# Installation Guide

Paperlight is currently distributed as an unpacked Chrome extension. A Chrome Web Store listing is in preparation.

## Prerequisites

- Google Chrome 116 or newer (Chromium-based browsers like Edge, Brave, Arc are also supported — they share Chrome's extension API and Side Panel surface)
- Node.js 20 or newer (only for development; end users skip this)

## Option A — Install from source (developer / preview)

```bash
git clone https://github.com/bogyungpark/paperlight-extension.git
cd paperlight-extension
npm install
npm run build
```

This produces a `dist/` folder. Then in Chrome:

1. Open `chrome://extensions`
2. Toggle **Developer mode** (top-right corner)
3. Click **Load unpacked**
4. Select the `paperlight-extension/dist` folder
5. Pin Paperlight from the puzzle-piece menu

## Option B — Install a packaged release

When a release zip is published on GitHub:

1. Download `paperlight-extension-<version>.zip` from the [releases page](https://github.com/bogyungpark/paperlight-extension/releases)
2. Extract the zip to any folder
3. Follow steps 1–5 from Option A, selecting the extracted folder

## Configure an API key

1. Click the Paperlight icon → side panel opens
2. Click the ⚙️ icon (top right of the side panel)
3. Pick a provider — OpenAI, Anthropic, or Gemini
4. Paste your API key (it never leaves your browser; stored in `chrome.storage.local`)
5. Adjust the target language and model if you want

Free options to grab a key:

| Provider  | Where to get a key                                          | Default model                |
| --------- | ----------------------------------------------------------- | ---------------------------- |
| OpenAI    | <https://platform.openai.com/api-keys>                      | `gpt-4o-mini`                |
| Anthropic | <https://console.anthropic.com/settings/keys>               | `claude-haiku-4-5-20251001`  |
| Gemini    | <https://aistudio.google.com/apikey>                        | `gemini-1.5-flash`           |

## First run

1. Open any research-paper PDF in Chrome (e.g. an arXiv PDF link)
2. Right-click anywhere on the page → **Open current PDF in Paperlight**
3. Drag-select text — a floating menu appears with **Explain · Translate · Summarize · Ask AI · 4 highlight colors**
4. Hover over `(Smith et al., 2024)` style citations to see Semantic Scholar previews

## Troubleshooting

- **Side panel never opens** — Chrome 114+ required. Try `chrome://extensions` → Paperlight → *Details* → ensure all permissions are granted.
- **PDF view shows blank** — open DevTools on the viewer tab and look for `pdf.worker.min.mjs` 404; rebuild with `npm run build` to refresh the worker copy.
- **AI requests fail with 401** — re-open Settings and re-paste your API key.
- **Highlights vanish after re-opening a PDF** — make sure your browser hasn't cleared site data; IndexedDB lives under the extension origin.

## Uninstall

`chrome://extensions` → Paperlight → **Remove**. Highlights and settings stored in the extension origin are removed with it.
