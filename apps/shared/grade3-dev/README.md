# 3年生 開発中プリント共通部品

3年生の仮実装プリントで使う共通ファイル。

## ファイル

- `worksheet.css`
  - 設定パネル、A4プレビュー、印刷用レイアウトの共通スタイル。
- `worksheet.js`
  - 入力欄、印刷、共有URL、問題生成、答えページ生成の共通ロジック。

## 使い方

各アプリの `index.html` で、以下を読み込む。

```html
<link rel="stylesheet" href="../shared/grade3-dev/worksheet.css">
<script src="../shared/grade3-dev/worksheet.js"></script>
```

読み込み前に `window.GRADE3_APP_CONFIG` を定義する。

```js
window.GRADE3_APP_CONFIG = {
  id: "division-print-grade3",
  title: "3年生 わり算プリント",
  kind: "division",
  accent: "#b45f06",
  notice: "開発中の説明文",
  types: [
    { value: "basic", label: "九九を使うわり算" },
  ],
};
```

## 注意

- ここは「開発中」アプリ用の共通部品。
- 完成版の共通基盤にする場合は、別途 `apps/shared/worksheet/` などへ昇格する。
- `id` は localStorage のキーに使われるため、公開後は安易に変更しない。
