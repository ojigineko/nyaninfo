# にゃんインフォ（NyanInfo）

Stable Diffusion PNGInfo抽出ツール『にゃんインフォ』は、Stable Diffusionで生成された画像からPNGInfoを簡単に抽出するためのWebアプリケーションです。

## 機能

- PNG画像のドラッグ＆ドロップまたはファイル選択による読み込み
- プロンプト、ネガティブプロンプト、パラメータの自動抽出
- 抽出されたテキストの簡単コピー機能
- レスポンシブデザイン対応
- エラーログ記録機能

## 使い方

1. Webブラウザで `index.html` を開きます
2. 画像をドラッグ＆ドロップするか、「ファイルを選択」ボタンをクリックしてPNG画像を選択します
3. 抽出されたPNGInfoが表示されます
4. 「コピー」ボタンをクリックして、必要な情報をクリップボードにコピーできます

## 技術仕様

- HTML5, CSS3, JavaScript（ES6）を使用
- 外部ライブラリやフレームワークに依存しない軽量設計
- ブラウザ上で完結する処理（サーバー不要）
- エラーログ機能によるトラブルシューティングのサポート

## 開発者

- Ojigineko (@ojigineko_tips)

## ライセンス

© 2025 PNGInfo抽出ツール Ojigineko

## 対応フォーマット

以下のStable Diffusionフロントエンドで生成された画像に対応しています：

- Automatic1111 WebUI
- ComfyUI
- NovelAI
- その他のtEXtまたはiTXtチャンクにメタデータを格納するフロントエンド

## ファイル構成

```
PNGinfoGetter/
├── index.html          # メインHTMLファイル
├── css/
│   └── style.css       # スタイルシート
├── js/
│   ├── app.js          # メインアプリケーションロジック
│   ├── pnginfo.js      # PNGinfo抽出ロジック
│   └── logger.js       # ロギング機能
├── img/
│   └── upload-icon.svg # アップロードアイコン
├── logs/               # ログファイル保存ディレクトリ
├── knowledge.md        # PNGinfoに関するナレッジベース
└── README.md           # このファイル
```

## エラーログ

エラーが発生した場合、自動的に`pnginfo_error_log.md`ファイルがダウンロードされます。このファイルには、エラーの詳細情報が記録されています。

## 開発者向け情報

### PNGファイル構造

PNGファイルは、8バイトのシグネチャ（89 50 4E 47 0D 0A 1A 0A）に続いて、複数のチャンクで構成されています。各チャンクは以下の構造を持ちます：

- 長さ（4バイト）
- チャンクタイプ（4バイト）
- チャンクデータ（長さで指定されたバイト数）
- CRC（4バイト）

Stable Diffusionのメタデータは、主に`tEXt`チャンクと`iTXt`チャンクに格納されています。

詳細については、`knowledge.md`ファイルを参照してください。 