function createContextMenuItem() {
  chrome.contextMenus.create({
    id: 'demystify-code',
    title: 'Demystify code',
    contexts: ['selection'],
  });
}

async function handleContextMenuClick(info: chrome.contextMenus.OnClickData) {
  if (info.menuItemId !== 'demystify-code') return;
  chrome.action.openPopup();
}

chrome.runtime.onInstalled.addListener(createContextMenuItem);
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
