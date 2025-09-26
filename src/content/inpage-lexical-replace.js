(function() {
  // --- ヘルパ: data-lexical-editor の要素から editor オブジェクトを探す ---
  function findLexicalEditors() {
    const editors = new Set();

    // 1) data-lexical-editor 属性を持つ要素を探す
    document.querySelectorAll('[data-lexical-editor]').forEach(el => {
      // その要素のプロパティを走査して `update()` を持つオブジェクトを発見する
      for (const key in el) {
        try {
          const v = el[key];
          if (v && typeof v === 'object' && typeof v.update === 'function' && typeof v.getEditorState === 'function') {
            editors.add(v);
            break;
          }
        } catch(e) { /* property getter が throw しても無視 */ }
      }
    });

    // 2) ページ内のグローバル等に editor が露出しているケースもある — 探して add
    // (任意) window に露出している全オブジェクトもチェックするのは重いので必要時追加すること。

    return Array.from(editors);
  }

  // --- Lexical 用に最小限の EditorState JSON を作る（プレーンテキスト用） ---
  function makeLexicalPlainJSON(text) {
    // Lexical の基本的な JSON 形式（root->paragraph->text）を構築する。
    // カスタムノードを使っている編集器だと失敗する可能性がある点に注意。
    return JSON.stringify({
      root: {
        children: [
          {
            type: "paragraph",
            children: [
              {
                type: "text",
                text: String(text),
                version: 1
              }
            ],
            version: 1
          }
        ],
        type: "root",
        version: 1
      }
    });
  }

  // --- 実際に置換を試みる ---
  async function replaceLexicalContent(translation) {
    const editors = findLexicalEditors();
    if (editors.length === 0) {
      return { ok: false, reason: 'no-editors-found' };
    }

    const results = [];

    for (const editor of editors) {
      let ok = false, err = null;

      // まず安全な方法：parseEditorState + setEditorState
      try {
        if (typeof editor.parseEditorState === 'function' && typeof editor.setEditorState === 'function') {
          const jsonStr = makeLexicalPlainJSON(translation);
          const state = editor.parseEditorState(jsonStr);
          editor.setEditorState(state);
          ok = true;
        }
      } catch (e) {
        err = e;
      }

      // 次のフォールバック： editor.update(...) を直接使う（ページが $createTextNode 等をグローバルに出していれば）
      if (!ok) {
        try {
          if (typeof editor.update === 'function') {
            // ここで $getRoot などがグローバルにあれば使う
            if (typeof window.$getRoot === 'function') {
              editor.update(() => {
                const root = window.$getRoot();
                root.clear();
                const p = window.$createParagraphNode ? window.$createParagraphNode() : null;
                if (p && window.$createTextNode) {
                  p.append(window.$createTextNode(translation));
                  root.append(p);
                } else {
                  // 最悪、root.appendText があれば使う（存在しないことが多い）
                  try { root.append(window.$createTextNode(translation)); } catch(e) {}
                }
              });
              ok = true;
            }
          }
        } catch (e2) {
          if (!err) err = e2;
        }
      }

      results.push({ editorFound: !!editor, ok, error: err && String(err) });
    }

    return { ok: results.some(r=>r.ok), details: results };
  }

  // 受信インターフェース（content script から postMessage で translation を受け取る例）
  window.addEventListener('message', async (ev) => {
    if (!ev.data || ev.data.__FROM_EXTENSION__ !== 'REPLACE_LEXICAL') return;
    const translation = ev.data.translation;
    const r = await replaceLexicalContent(translation);
    // 結果を返す
    window.postMessage({ __FROM_PAGE__:'REPLACE_LEXICAL_RESULT', result: r }, '*');
  }, false);

})();