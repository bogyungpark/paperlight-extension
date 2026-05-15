/// <reference types="chrome" />

// MVP content script — selection detection + floating menu wiring is fleshed out in STEP 3.
// For STEP 1, we keep it minimal so the bundle builds cleanly.

function isPdfPage(): boolean {
  return (
    location.pathname.toLowerCase().endsWith('.pdf') ||
    document.contentType === 'application/pdf' ||
    !!document.querySelector('embed[type="application/pdf"]')
  );
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
  chrome.runtime.sendMessage({ type: 'paperlight:pdf-detected', url: location.href });
}

export {};
