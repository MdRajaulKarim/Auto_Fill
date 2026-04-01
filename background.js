/**
 * Background service worker.
 * Handles context menu creation and routes messages between popup and content scripts.
 */

const CONTEXT_MENU_ID = "autofill_trigger";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Auto Fill: Fill form fields",
    contexts: ["page", "editable"]
  });
  initDefaultStorage();
});

/** Ensure storage has at least an empty profiles array on first install. */
function initDefaultStorage() {
  chrome.storage.local.get(["profiles", "activeProfileId"], (data) => {
    if (!data.profiles) {
      chrome.storage.local.set({ profiles: [], activeProfileId: null });
    }
  });
}

/** Re-create context menu when the service worker restarts. */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID) {
    triggerFill(tab);
  }
});

/** Send fill command to the active tab's content script. */
async function triggerFill(tab) {
  if (!tab || !tab.id) return;
  const data = await chrome.storage.local.get(["profiles", "activeProfileId"]);
  const profiles = data.profiles || [];
  const activeId = data.activeProfileId;
  const profile = profiles.find((p) => p.id === activeId) || profiles[0];
  if (!profile) return;

  chrome.tabs.sendMessage(tab.id, {
    action: "fill",
    profile
  });
}

/** Handle messages from popup requesting a fill. */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "triggerFill") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        triggerFill(tabs[0]);
      }
      sendResponse({ ok: true });
    });
    // Return true to keep the message channel open for the async sendResponse call.
    return true;
  }
  return false;
});
