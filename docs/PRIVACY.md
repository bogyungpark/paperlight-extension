# Privacy

Paperlight is a privacy-first reader. The short version:

- **Your API keys never leave your browser.** They're stored in `chrome.storage.local`, which is sandboxed to the extension. The side panel reads them at request time and calls the AI provider you chose directly.
- **No Paperlight server.** There is no backend operated by us. AI prompts go straight from your machine to OpenAI / Anthropic / Google.
- **No telemetry.** We don't ship analytics SDKs, error trackers, or ping-home heartbeats. The only outbound network traffic Paperlight performs is to:
  - the AI provider you selected (OpenAI / Anthropic / Gemini endpoint)
  - the Semantic Scholar Graph API (only when you hover a citation marker)
  - the PDF host you're reading from (only when you point the viewer at a URL)
- **Local-only storage.** Highlights, notes, parsed page text, and the citation cache live in:
  - **IndexedDB** (origin: the extension itself) — `documents` and `highlights` object stores
  - **`chrome.storage.local`** — settings (provider, keys, model, language, theme) and the active document ID
  - Removing the extension removes all of this.

## Per-feature data flow

| Feature           | Sent to                                                   | What is sent                                                                |
| ----------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| Explain / Translate / Summarize / Chat | AI provider you selected                | The system prompt, your message, the selected passage, and (optionally) the parsed paper text trimmed to ~16k characters. |
| Citation preview  | `api.semanticscholar.org`                                 | The literal citation snippet (e.g. `Smith et al., 2024`).                   |
| PDF rendering     | The PDF's host (e.g. `arxiv.org`)                         | A standard `fetch()` to download the file you asked to open.                |

## Permissions used

| Manifest permission   | Why                                                                 |
| --------------------- | ------------------------------------------------------------------- |
| `storage`             | Persist settings, active document, and citation cache               |
| `sidePanel`           | Show the Paperlight side panel UI                                   |
| `activeTab`           | Open the side panel against the tab the user invoked it on          |
| `scripting`           | Reserved for future selection-injection on dynamic pages            |
| `contextMenus`        | "Open current PDF in Paperlight" and "Explain selection" entries    |
| `host_permissions: <all_urls>` | Run the selection menu content script on any page the user reads. We make **zero** network calls from the content script — it only listens for `mouseup` and forwards selections to the side panel. |

## How to inspect what we send

Open Chrome DevTools while the side panel is focused → Network tab. Every AI call is a single request to `api.openai.com` / `api.anthropic.com` / `generativelanguage.googleapis.com`. Body contents are visible there.

## Reporting issues

If you find a privacy bug, please open an issue: <https://github.com/bogyungpark/paperlight-extension/issues>.
