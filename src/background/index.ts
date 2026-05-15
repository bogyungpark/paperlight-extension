/// <reference types="chrome" />

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
  } catch (e) {
    // contextMenus may not be available in certain contexts; ignore.
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

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'paperlight:ping') {
    sendResponse({ ok: true, ts: Date.now() });
    return true;
  }
  return undefined;
});

export {};
