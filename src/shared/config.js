// config.js
// APIキーとエンドポイントURLをこのファイルで一元管理します。

// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// ▼▼▼ ご自身のAI APIキーをここに設定してください ▼▼▼
export const API_KEY = "AIzaSyDeSf1UxCtFgQo5-U1kWDdgozuh1mVk8W0";
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// APIキーを使ってAPIのURLを組み立てます
export const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
