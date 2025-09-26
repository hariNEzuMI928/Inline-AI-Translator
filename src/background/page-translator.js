/**
 * @file page-translator.js
 * @description ページ内翻訳機能（ショートカットキー）に関する責務を持つモジュール。
 *              APIリクエストのスロットリング（ロック）機構を実装。
 */

let isTranslating = false;
let scriptArgs = {};

export function initializePageTranslator() {
  chrome.commands.onCommand.addListener(handleCommand);
  chrome.runtime.onMessage.addListener(handleScriptArgsRequest);
}

function handleScriptArgsRequest(request, sender, sendResponse) {
  if (request.type === "get-script-args") {
    sendResponse(scriptArgs);
  }
}

async function handleCommand(command) {
  if (isTranslating) {
    console.log("翻訳処理が実行中のため、新しいリクエストは無視されました。");
    return;
  }

  const targetLanguage = getTargetLanguage(command);
  if (!targetLanguage) return;

  isTranslating = true;
  try {
    await initiatePageTranslation(targetLanguage);
  } finally {
    isTranslating = false;
  }
}

function getTargetLanguage(command) {
  switch (command) {
    case "translate_to_english":
      return "English";
    case "translate_to_german":
      return "German";
    default:
      return "";
  }
}

async function initiatePageTranslation(targetLanguage) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  if (await removeInjectionUI(tab.id)) return;

  scriptArgs = {
    targetLanguage,
    cssUrl: chrome.runtime.getURL("src/content/injection.css"),
  };

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["src/content/content-script.js"],
  });
}

async function removeInjectionUI(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const ui = document.getElementById("translator-ui-container");
      if (ui) {
        ui.classList.add("translator-removing");
        ui.addEventListener("animationend", () => ui.remove(), { once: true });
        return true;
      }
      return false;
    },
  });
  return result?.result || false;
}
