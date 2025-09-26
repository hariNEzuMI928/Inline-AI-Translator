/**
 * @file background.js (Orchestrator)
 * @description 拡張機能のメインService Worker。
 * 各機能モジュールを初期化し、モジュール間のAPIコールや注入処理を仲介する。
 */
import { translateText } from "../shared/service.js";
import { initializePageTranslator } from "./page-translator.js";
import { initializeOmniboxHandler } from "./omnibox-handler.js";

// --- 初期化 ---
initializePageTranslator(injectContentScript);
initializeOmniboxHandler();

// content-script注入処理を関数化
async function injectContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["src/content/content-script.js"],
  });
}

// --- メッセージブローカー ---
chrome.runtime.onMessage.addListener(handleMessage);

function handleMessage(request, sender, sendResponse) {
  if (request.type === "translate") {
    handleTranslateRequest(request, sendResponse);
    return true;
  }
  if (request.type === "replace-lexical") {
    handleReplaceLexicalRequest(request, sender, sendResponse);
    return true; // Indicate that sendResponse will be called asynchronously
  }
  // get-script-argsは page-translator.js 側で処理
}

function handleTranslateRequest(request, sendResponse) {
  translateText(request.text, request.lang)
    .then((result) => sendResponse({ data: result }))
    .catch((err) => {
      sendResponse({
        error: {
          message: err.message,
          name: err.name,
          status: err.status,
          details: err.details,
        },
      });
    });
}

async function handleReplaceLexicalRequest(request, sender, sendResponse) {
  try {
    const tabId = sender.tab.id;
    const translation = request.translation;

    // Listen for result from inpage script (via content script)
    const resultPromise = new Promise(resolve => {
      const listener = (message, sender, sendResponseInner) => {
        if (sender.tab.id === tabId && message && message.__FROM_PAGE__ === 'REPLACE_LEXICAL_RESULT') {
          chrome.runtime.onMessage.removeListener(listener);
          resolve(message.result);
          sendResponseInner(); // Acknowledge receipt of message
          return true;
        }
      };
      chrome.runtime.onMessage.addListener(listener);
    });

    // Inject script into MAIN world
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['src/content/inpage-lexical-replace.js'],
      world: 'MAIN' // Execute in the page's main world
    });

    // Send translation to inpage script via content script (using postMessage)
    // The content script will then forward this to the inpage script
    await chrome.tabs.sendMessage(tabId, {
      __FROM_BACKGROUND__: 'SEND_TRANSLATION_TO_INPAGE',
      translation: translation
    });

    const result = await resultPromise;
    sendResponse(result);

  } catch (error) {
    console.error("Error in handleReplaceLexicalRequest:", error);
    sendResponse({ ok: false, reason: error.message });
  }
}