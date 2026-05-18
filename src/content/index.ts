/// <reference types="chrome" />

// Floating selection menu, injected as a Shadow DOM so host page styles
// can never bleed in. Mirrors the viewer's FloatingMenu but lives in
// vanilla TS (content scripts run in an isolated world without React).

type AIIntent = 'explain' | 'translate' | 'summarize' | 'chat';

interface ActionDef {
  intent: AIIntent;
  label: string;
  shortcut: string;
  svg: string;
}

const ACTIONS: ActionDef[] = [
  {
    intent: 'explain',
    label: 'Explain',
    shortcut: 'E',
    svg: '<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1" stroke-linecap="round"/>',
  },
  {
    intent: 'translate',
    label: 'Translate',
    shortcut: 'T',
    svg: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  },
  {
    intent: 'summarize',
    label: 'Summarize',
    shortcut: 'S',
    svg: '<path d="M4 6h16M4 12h16M4 18h10" stroke-linecap="round"/>',
  },
  {
    intent: 'chat',
    label: 'Ask AI',
    shortcut: 'A',
    svg: '<path d="M21 12a8 8 0 0 1-12.5 6.6L4 20l1.4-4.5A8 8 0 1 1 21 12Z" stroke-linejoin="round"/>',
  },
];

const STYLE = `
:host { all: initial; }
.menu {
  position: fixed;
  z-index: 2147483646;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(22, 25, 31, 0.96);
  color: rgb(236, 238, 242);
  border: 1px solid rgba(56, 60, 70, 0.6);
  box-shadow: 0 8px 32px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.04);
  backdrop-filter: blur(20px);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  font-weight: 500;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 140ms ease-out, transform 160ms cubic-bezier(0.16,1,0.3,1);
  pointer-events: none;
}
.menu.open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: rgb(156, 162, 173);
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  transition: background 120ms ease, color 120ms ease;
}
.btn:hover { background: rgba(36, 40, 48, 0.85); color: rgb(236, 238, 242); }
.btn:focus-visible {
  outline: 2px solid rgba(129, 140, 248, 0.6);
  outline-offset: 2px;
}
.sep { width: 1px; height: 16px; background: rgba(56, 60, 70, 0.6); margin: 0 4px; }
.preview {
  max-width: 140px;
  font-family: 'JetBrains Mono', SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  color: rgb(116, 122, 133);
  padding: 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media (max-width: 480px) { .sep, .preview { display: none; } }
svg { display: block; }
`;

let host: HTMLDivElement | null = null;
let menuEl: HTMLDivElement | null = null;
let previewEl: HTMLSpanElement | null = null;
let currentSelectionText = '';
let suppressedUntil = 0;

function isPdfPage(): boolean {
  return (
    location.pathname.toLowerCase().endsWith('.pdf') ||
    document.contentType === 'application/pdf' ||
    !!document.querySelector('embed[type="application/pdf"]')
  );
}

function buildMenu(): void {
  if (host) return;
  host = document.createElement('div');
  host.setAttribute('data-paperlight-host', 'true');
  host.style.cssText =
    'position:fixed;inset:0;width:0;height:0;pointer-events:none;z-index:2147483646;';
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = STYLE;
  shadow.appendChild(style);

  menuEl = document.createElement('div');
  menuEl.className = 'menu';
  menuEl.setAttribute('role', 'menu');
  menuEl.setAttribute('aria-label', 'Paperlight actions');

  for (const action of ACTIONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.title = `${action.label} (Shift+${action.shortcut})`;
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        ${action.svg}
      </svg>
      <span>${action.label}</span>
    `;
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dispatchAction(action.intent);
    });
    menuEl.appendChild(btn);
  }

  const sep = document.createElement('span');
  sep.className = 'sep';
  menuEl.appendChild(sep);

  previewEl = document.createElement('span');
  previewEl.className = 'preview';
  menuEl.appendChild(previewEl);

  shadow.appendChild(menuEl);
  document.documentElement.appendChild(host);
}

function dispatchAction(intent: AIIntent): void {
  if (!currentSelectionText) return;
  const text = currentSelectionText;
  hideMenu();
  suppressedUntil = Date.now() + 600;
  window.getSelection()?.removeAllRanges();
  chrome.runtime
    .sendMessage({
      type: 'paperlight:ai-request',
      intent,
      selection: text,
      sourceUrl: location.href,
      pageNumber: null,
      documentTitle: document.title || null,
      fullContext: null,
    })
    .catch((e) => console.warn('[paperlight] dispatch failed', e));
}

function positionMenu(rect: DOMRect): void {
  if (!menuEl) return;
  menuEl.classList.add('open');
  const menuRect = menuEl.getBoundingClientRect();
  const margin = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = rect.left + rect.width / 2 - menuRect.width / 2;
  left = Math.max(margin, Math.min(left, vw - menuRect.width - margin));
  let top: number;
  if (rect.top - menuRect.height - margin > margin) {
    top = rect.top - menuRect.height - margin;
  } else if (rect.bottom + menuRect.height + margin < vh - margin) {
    top = rect.bottom + margin;
  } else {
    top = Math.max(margin, vh - menuRect.height - margin);
  }
  menuEl.style.left = `${Math.round(left)}px`;
  menuEl.style.top = `${Math.round(top)}px`;
}

function hideMenu(): void {
  if (!menuEl) return;
  menuEl.classList.remove('open');
  menuEl.style.left = '-9999px';
  menuEl.style.top = '-9999px';
  currentSelectionText = '';
}

function handleSelectionMaybe(): void {
  if (Date.now() < suppressedUntil) return;
  const sel = window.getSelection();
  const text = sel?.toString().trim();
  if (!sel || !text || sel.rangeCount === 0) {
    hideMenu();
    return;
  }
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    hideMenu();
    return;
  }
  buildMenu();
  currentSelectionText = text;
  if (previewEl) {
    previewEl.textContent = text.length > 38 ? `${text.slice(0, 36)}…` : text;
  }
  positionMenu(rect);
}

function init(): void {
  document.addEventListener(
    'mouseup',
    () => {
      requestAnimationFrame(handleSelectionMaybe);
    },
    true,
  );
  document.addEventListener(
    'mousedown',
    (e) => {
      const path = (e.composedPath?.() ?? []) as EventTarget[];
      if (path.some((n) => n instanceof Element && n.getAttribute?.('data-paperlight-host'))) {
        return;
      }
      hideMenu();
    },
    true,
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideMenu();
  });
  document.addEventListener('scroll', () => hideMenu(), true);
  window.addEventListener('resize', () => hideMenu());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'paperlight:get-selection-for-explain') {
    const text = window.getSelection()?.toString().trim() ?? '';
    if (text) {
      chrome.runtime.sendMessage({
        type: 'paperlight:ai-request',
        intent: 'explain',
        selection: text,
        sourceUrl: location.href,
        pageNumber: null,
        documentTitle: document.title || null,
        fullContext: null,
      });
    }
    sendResponse({ ok: true, length: text.length });
    return true;
  }
  if (msg?.type === 'paperlight:is-pdf') {
    sendResponse({ pdf: isPdfPage(), url: location.href });
    return true;
  }
  return undefined;
});

if (isPdfPage()) {
  chrome.runtime
    .sendMessage({ type: 'paperlight:pdf-detected', url: location.href })
    .catch(() => {});
}

export {};
