/**
 * @file service.js
 * @description AI APIとの通信を担当する共有サービス。
 *              詳細なエラーハンドリング機構を持つ。
 */
import { API_URL } from "./config.js";

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function translateText(originalText, targetLanguage = "English") {
  const prompt = `# Role and Objective
- Translate a given text between Japanese and a specified target language (${targetLanguage}) based on the detected source language.

# Internal Checklist (for reasoning only)

- The checklist below is for your internal reasoning process. DO NOT include it in the final output.

# Instructions

- Detect the input text's language.
- If the text is in Japanese, translate it to ${targetLanguage}.
- If the text is in ${targetLanguage}, translate it to Japanese.
- If the text is empty or invalid, return just an empty string as the output.

# Input

- This is the given text: ${originalText}

# Output Format

- Return ONLY the translated text as a plain string.
- Do not include explanations, checklists, or formatting.
- Do not add extra words, symbols, or commentary.

# Stop Conditions

- Stop immediately after outputting the translation (or empty string).`;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });
  const data = await response.json();

  if (!response.ok) {
    const errorMessage =
      data?.error?.message ||
      `API request failed with status ${response.status}`;
    throw new ApiError(errorMessage, response.status, data.error);
  }

  const translation = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (translation) {
    return translation;
  }

  const fallbackError = data?.error || {
    message: "有効な翻訳結果が得られませんでした。",
  };
  throw new ApiError(fallbackError.message, response.status, fallbackError);
}
