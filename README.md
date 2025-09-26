# Inline-AI-Translator

## Overview

This is a Chrome extension that leverages the Google Gemini API to instantly translate text into natural Japanese, English, German, and more.
You can seamlessly perform translations using shortcut keys, the Omnibox (search bar), or the popup UI.

---

## Key Features

- **Instant In-Page Text Translation**
  Translate selected text with a shortcut key and automatically replace it in the original field.

- **Popup UI**
  Click the extension icon, enter text, and get/copy translation results.

- **Omnibox (Search Bar) Translation**
  In Chrome's address bar, type the `tr` keyword, then enter text to see instant translation suggestions.

- **Error Notifications**
  In case of API errors or communication failures, clear messages are displayed in both the UI and the console.

---

## Installation

1. Clone this repository

   ```
   git clone https://github.com/your_username/ai_translator_extension.git
   ```

2. Obtain a [Google Gemini API Key](https://ai.google.dev/) and set it as `API_KEY` in `src/shared/config.js`.

3. In Chrome's "Extensions" screen, select "Load unpacked" and choose this folder.

---

## Usage

- **Shortcut Keys**

  - `Alt+A`: Translate Japanese to English, or English to Japanese
  - `Alt+D`: Translate Japanese to German, or German to Japanese
    (Settings can be changed in `manifest.json` under `commands`)

- **Popup UI**

  1. Click the extension icon
  2. Enter text
  3. Select a language and click the "Translate" button

- **Omnibox**
  1. In Chrome's address bar, type `tr`
  2. Enter text to see translation suggestions

---

## Development & Customization

- Gemini API endpoints and supported languages can be changed in `src/shared/config.js`
- UI styles can be adjusted in `src/content/injection.css` and `src/popup/style.css`
- Error handling is centrally managed in `src/shared/error-handler.js`

---

## License

MIT License

---

## Notes

- This extension relies on Google Gemini API usage limits and API key validity.
- Please be careful not to leak your API key to third parties.

---

## Folder Structure Example

```
src/
  background/      ... Background processing
  content/         ... Page injection UI/scripts
  popup/           ... Popup UI
  shared/          ... API, error handling, and other common modules
manifest.json      ... Extension definition
```

---

## Contribute

Bug reports, feature suggestions, and pull requests are welcome!
(Details to be added later)
