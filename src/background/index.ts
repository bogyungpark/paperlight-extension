/// <reference types="chrome" />

const VIEWER_PATH = 'src/viewer/index.html';

function viewerUrl(src?: string): string {
  const base = chrome.runtime.getURL(VIEWER_PATH);
  return src ? `${base}?src=${encodeURIComponent(src)}` : base;
}

chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: 'paperlight-explain',
      title: 'Explain with Paperlight',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: 'paperlight-translate',
      title: 'Translate with Paperlight',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: 'paperlight-summarize',
      title: 'Summarize with Paperlight',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: 'paperlight-open-current-pdf',
      title: 'Open current PDF in Paperlight',
      contexts: ['page'],
      documentUrlPatterns: ['*://*/*.pdf', 'file:///*.pdf'],
    });
  } catch (e) {
    console.warn('[paperlight] contextMenu setup failed', e);
  }

  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((e) => console.warn('[paperlight] sidePanel setPanelBehavior failed', e));
  }
});

chrome.action?.onClicked.addListener(async (tab) => {
  if (tab.id != null) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (e) {
      console.warn('[paperlight] sidePanel.open failed', e);
    }
  }
});

chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'paperlight-open-current-pdf' && tab?.url) {
    chrome.tabs.create({ url: viewerUrl(tab.url) });
    return;
  }
  if (!info.selectionText || !tab?.id) return;
  const intent =
    info.menuItemId === 'paperlight-translate'
      ? 'translate'
      : info.menuItemId === 'paperlight-summarize'
        ? 'summarize'
        : 'explain';
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (e) {
    console.warn('[paperlight] sidePanel.open failed', e);
  }
  chrome.runtime.sendMessage({
    type: 'paperlight:ai-request',
    intent,
    selection: info.selectionText,
    sourceUrl: tab.url ?? null,
  });
});

chrome.commands?.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  if (command === 'toggle-sidepanel') {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (e) {
      console.warn('[paperlight] sidePanel.open failed', e);
    }
  } else if (command === 'explain-selection') {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (e) {
      console.warn('[paperlight] sidePanel.open failed', e);
    }
    chrome.tabs.sendMessage(tab.id, { type: 'paperlight:get-selection-for-explain' });
  }
});

async function openSidePanelForSender(sender: chrome.runtime.MessageSender) {
  const tabId =
    sender.tab?.id ??
    (await chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => tabs[0]?.id));
  if (tabId != null) {
    try {
      await chrome.sidePanel.open({ tabId });
    } catch (e) {
      console.warn('[paperlight] sidePanel.open failed', e);
    }
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'paperlight:ping') {
    sendResponse({ ok: true, ts: Date.now() });
    return true;
  }

  if (msg?.type === 'paperlight:open-in-viewer') {
    const url = msg.url ?? sender.tab?.url;
    if (url) chrome.tabs.create({ url: viewerUrl(url) });
    sendResponse({ ok: true });
    return true;
  }

  if (msg?.type === 'paperlight:open-sidepanel') {
    openSidePanelForSender(sender).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg?.type === 'paperlight:ai-request') {
    openSidePanelForSender(sender).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg?.type === 'paperlight:pdf-detected' && sender.tab?.id != null) {
    sendResponse({ ok: true });
    return false;
  }
  return undefined;
});

export {};
