/**
 * @file error-handler.js
 * @description アプリケーション全体で一貫したエラー処理を提供するための共有ユーティリティ
 */

export function getUserFriendlyErrorMessage(error) {
  let message = "翻訳に失敗しました。";
  if (!error || !error.status) return message;

  switch (error.status) {
    case 429:
      message = "APIの利用上限に達しました。";
      break;
    case 400:
      if (error.message?.includes("API key")) {
        message = "APIキーが正しくありません。";
      } else {
        message = "リクエスト内容が不正です。";
      }
      break;
    case 500:
    case 503:
      message = "サーバー側で一時的な問題が発生しました。";
      break;
  }
  return message;
}

export function logDetailedError(error, context = "Unknown Context") {
  if (!error) return;

  const keyStyle = "font-weight: bold; color: #9e9e9e;";
  console.groupCollapsed(
    `%c[AI Translator] Error in ${context}: ${
      error.message || "An unknown error occurred."
    }`,
    "color: #e57373; font-weight: bold;"
  );
  console.log(`%cMessage`, keyStyle, error.message);
  if (error.status) {
    console.log(`%cStatus`, keyStyle, error.status);
  }
  if (error.details) {
    console.log(`%cDetails`, keyStyle, error.details);
  }
  if (error.stack) {
    console.log(`%cStack`, keyStyle, error.stack);
  } else {
    console.log(`%cError Object`, keyStyle, error);
  }
  console.groupEnd();
}
