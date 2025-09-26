import { translateText } from "../shared/service.js";
import {
  getUserFriendlyErrorMessage,
  logDetailedError,
} from "../shared/error-handler.js";

let debounceTimer;

export function initializeOmniboxHandler() {
  chrome.omnibox.onInputChanged.addListener(handleInputChanged);
  chrome.omnibox.onInputEntered.addListener(handleInputEntered);
}

function handleInputChanged(text, suggest) {
  if (!text.trim()) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => suggestTranslation(text, suggest), 300);
}

async function suggestTranslation(text, suggest) {
  try {
    const translation = await translateText(text, "English");
    suggest([
      {
        content: translation,
        description: `英語翻訳: <match>${translation}</match>`,
      },
    ]);
  } catch (error) {
    const userMessage = getUserFriendlyErrorMessage(error);
    suggest([
      {
        content: `error:${userMessage}`,
        description: `エラー: ${userMessage}`,
      },
    ]);
    logDetailedError(error, "Omnibox");
  }
}

async function handleInputEntered(content) {
  if (content && !content.startsWith("error:")) {
    await copyToClipboard(content);
  }
}

async function copyToClipboard(text) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab) throw new Error("Active tab not found.");
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (textToCopy) => {
        const input = document.createElement("textarea");
        document.body.appendChild(input);
        input.value = textToCopy;
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      },
      args: [text],
    });
  } catch (err) {
    console.error("Failed to copy text:", err);
  }
}
