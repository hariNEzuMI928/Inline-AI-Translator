/**
 * @file content-script.js
 * @description ページ注入UIと翻訳処理の責務を持つ。エラー時はUIとコンソール両方に通知。
 */
(async () => {
  // --- 1. 共有モジュールのダイナミックインポート ---
  const { getUserFriendlyErrorMessage, logDetailedError } = await import(
    chrome.runtime.getURL("src/shared/error-handler.js")
  );

  // --- 2. 初期化と引数取得 ---
  let targetLanguage, cssUrl;
  try {
    const args = await chrome.runtime.sendMessage({ type: "get-script-args" });
    if (!args?.targetLanguage || !args?.cssUrl)
      throw new Error("Script arguments missing.");
    targetLanguage = args.targetLanguage;
    cssUrl = args.cssUrl;
  } catch (e) {
    logDetailedError(e, "Initialization");
    return;
  }

  // --- 3. 翻訳対象要素とテキスト検証 ---
  const el = document.activeElement;
  if (
    !el ||
    (!el.isContentEditable && !["INPUT", "TEXTAREA"].includes(el.tagName))
  )
    return;
  const originalText = el.isContentEditable ? el.textContent : el.value;
  if (!originalText.trim()) return;

  // --- 4. UI生成・更新ヘルパー ---
  function createUI() {
    document.getElementById("translator-ui-container")?.remove();
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.type = "text/css";
    styleLink.href = cssUrl;
    document.head.appendChild(styleLink);
    const ui = document.createElement("div");
    ui.id = "translator-ui-container";
    const rect = el.getBoundingClientRect();
    ui.style.left = `${window.scrollX + rect.left}px`;
    ui.style.top = `${window.scrollY + rect.top - 40}px`;
    document.body.appendChild(ui);
    return ui;
  }
  function updateUI(status, message) {
    const icons = {
      processing: '<div class="translator-spinner"></div>',
      success: '<div class="translator-success-icon">✓</div>',
      error: '<div class="translator-error-icon">!</div>',
    };
    ui.innerHTML = `${
      icons[status] || ""
    }<span id="translator-status-text" class="${status}">${message}</span>`;
  }
  const ui = createUI();

  // --- Content Script と Inpage Script の間の通信リスナー ---
  // Inpage Script からの結果を受け取り、Background Script に転送
  window.addEventListener('message', (event) => {
    if (event.source === window && event.data && event.data.__FROM_PAGE__ === 'REPLACE_LEXICAL_RESULT') {
      chrome.runtime.sendMessage(event.data); // Background Script に結果を転送
    }
  }, false);

  // Background Script からのメッセージを受け取り、Inpage Script に転送
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.__FROM_BACKGROUND__ === 'SEND_TRANSLATION_TO_INPAGE') {
      window.postMessage({
        __FROM_EXTENSION__: 'REPLACE_LEXICAL',
        translation: request.translation
      }, '*');
      sendResponse({ status: 'received' }); // Background Script に受信を通知
      return true; // 非同期応答を示す
    }
  });


  // --- 5. メイン翻訳処理 ---
  try {
    updateUI("processing", `翻訳中...`);
    const response = await chrome.runtime.sendMessage({
      type: "translate",
      text: originalText,
      lang: targetLanguage,
    });
    if (response.error) throw response.error;
    const translation = response.data;
    if (typeof translation !== "string")
      throw new Error("Invalid translation format.");

    el.focus();
    if (el.isContentEditable) {
      if (el.hasAttribute('data-lexical-editor')) {
        // For Lexical editors, send message to background script to handle injection
        const lexicalResult = await chrome.runtime.sendMessage({
          type: "replace-lexical",
          translation: translation
        });

        if (lexicalResult && lexicalResult.ok) {
          updateUI("success", "翻訳が完了しました (Lexical)");
        } else {
          console.error("Lexical replacement failed:", lexicalResult?.details || lexicalResult?.reason || "Unknown error");
          updateUI("error", "Lexicalエディタの置換に失敗しました。手動で貼り付けてください。");
          await navigator.clipboard.writeText(translation); // Fallback to clipboard
        }

      } else {
        // For other contenteditable elements, use execCommand
        document.execCommand("selectAll", false, null);
        document.execCommand("insertText", false, translation);
        updateUI("success", "翻訳が完了しました");
      }
    } else {
      // For INPUT/TEXTAREA elements, use execCommand
      el.select();
      document.execCommand("insertText", false, translation);
      updateUI("success", "翻訳が完了しました");
    }
  } catch (error) {
    // --- 6. エラーハンドリング ---
    const msg = getUserFriendlyErrorMessage(error);
    updateUI("error", msg);
    logDetailedError(error, "ContentScript");
  } finally {
    // --- 7. UIの自動クローズ ---
    setTimeout(() => {
      ui?.classList.add("translator-removing");
      ui?.addEventListener("animationend", () => ui.remove(), { once: true });
    }, 3000);
  }
})();