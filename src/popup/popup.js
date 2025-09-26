import { translateText } from "../shared/service.js";
import {
  getUserFriendlyErrorMessage,
  logDetailedError,
} from "../shared/error-handler.js";

document.addEventListener("DOMContentLoaded", () => {
  const translateButton = document.getElementById("translate-button");
  const japaneseInput = document.getElementById("japanese-input");
  const languageSelect = document.getElementById("language-select");
  const translationOutput = document.getElementById("translation-output");
  const copyButton = document.getElementById("copy-button");

  translateButton.addEventListener("click", handleTranslateClick);
  copyButton.addEventListener("click", handleCopyClick);

  function setOutput(message, showCopy = false) {
    translationOutput.textContent = message;
    copyButton.style.display = showCopy ? "inline-block" : "none";
    copyButton.textContent = "コピー";
  }

  async function handleTranslateClick() {
    const japaneseText = japaneseInput.value.trim();
    if (!japaneseText) {
      setOutput("翻訳したいテキストを入力してください。");
      return;
    }
    const targetLanguage = languageSelect.value;
    setOutput("翻訳中...");

    try {
      const translation = await translateText(japaneseText, targetLanguage);
      setOutput(translation, true);
    } catch (error) {
      const userMessage = getUserFriendlyErrorMessage(error);
      setOutput(userMessage);
      logDetailedError(error, "Popup");
    }
  }

  function handleCopyClick() {
    const textToCopy = translationOutput.textContent;
    if (textToCopy && textToCopy !== "翻訳中...") {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          copyButton.textContent = "コピーしました！";
          setTimeout(() => {
            copyButton.textContent = "コピー";
          }, 2000);
        })
        .catch((err) => {
          console.error("コピーに失敗しました", err);
        });
    }
  }
});
