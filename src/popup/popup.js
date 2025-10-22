import { translateText } from "../shared/service.js";
import {
  getUserFriendlyErrorMessage,
  logDetailedError,
} from "../shared/error-handler.js";

document.addEventListener("DOMContentLoaded", () => {
  const actionButton = document.getElementById("translate-button"); // This button will act as both translate and copy
  const japaneseInput = document.getElementById("japanese-input");
  const languageSelect = document.getElementById("language-select");
  const translationOutput = document.getElementById("translation-output");

  japaneseInput.focus(); // Focus on the input field when the popup opens

  actionButton.addEventListener("click", handleActionButtonClick);
  japaneseInput.addEventListener("input", handleInput); // Listen for input changes to reset button
  japaneseInput.addEventListener("keydown", handleKeyDown); // Listen for keyboard shortcuts

  let currentMode = "translate"; // "translate" or "copy"

  function setOutput(message) {
    translationOutput.textContent = message;
  }

  function setMode(mode) {
    currentMode = mode;
    if (mode === "translate") {
      actionButton.textContent = "翻訳";
    } else if (mode === "copy") {
      actionButton.textContent = "コピー";
    }
  }

  function handleActionButtonClick() {
    if (currentMode === "translate") {
      handleTranslateClick();
    } else {
      handleCopyClick();
    }
  }

  function handleInput() {
    // When input changes, revert to translate mode
    setMode("translate");
    setOutput(""); // Clear previous translation output
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
      setOutput(translation);
      setMode("copy");
    } catch (error) {
      const userMessage = getUserFriendlyErrorMessage(error);
      setOutput(userMessage);
      logDetailedError(error, "Popup");
      setMode("translate"); // Revert to translate mode on error
    }
  }

  function handleCopyClick() {
    const textToCopy = translationOutput.textContent;
    if (textToCopy && textToCopy !== "翻訳中...") {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          actionButton.textContent = "コピーしました！"; // Temporarily change button text
          setTimeout(() => {
            setMode("copy"); // Revert to copy mode after a delay
          }, 2000);
        })
        .catch((err) => {
          console.error("コピーに失敗しました", err);
          setMode("copy"); // Ensure button is still in copy mode on error
        });
    }
  }

  function handleKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault(); // Prevent new line in textarea
      handleActionButtonClick();
    }
  }
});
