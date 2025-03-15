# PNGInfo抽出ツール ナレッジベース

## PNGinfoとは

PNGinfoとは、Stable Diffusionなどの画像生成AIが生成した画像に埋め込まれるメタデータのことです。このメタデータには、画像生成に使用されたプロンプト、ネガティブプロンプト、その他のパラメータ（サンプラー、ステップ数、シード値など）が含まれています。

## PNGファイルの構造

PNGファイルは、以下の構造を持っています：

1. **PNGシグネチャ**: 8バイトの固定値（89 50 4E 47 0D 0A 1A 0A）
2. **チャンク**: データの塊で、以下の構造を持つ
   - 長さ（4バイト）
   - チャンクタイプ（4バイト）
   - チャンクデータ（長さで指定されたバイト数）
   - CRC（4バイト）

## メタデータを含むチャンク

Stable Diffusionのメタデータは、主に以下のチャンクに格納されます：

1. **tEXt**: テキストデータを格納するチャンク
   - キーワード + NULL + テキスト
   - 例: `prompt\0masterpiece, best quality, 1girl`

2. **iTXt**: 国際化テキストデータを格納するチャンク
   - キーワード + NULL + 圧縮フラグ + 圧縮方法 + 言語タグ + NULL + 翻訳キーワード + NULL + テキスト
   - より長いテキストや特殊文字を含むテキストに使用される

## 一般的なメタデータキー

Stable DiffusionのウェブUIやその他のフロントエンドでは、以下のようなキーが使用されます：

- `prompt`: 生成に使用されたプロンプト
- `negativePrompt`: 生成に使用されたネガティブプロンプト
- `parameters`: その他のパラメータ（サンプラー、ステップ数、シード値など）
- `Description`: プロンプト（一部のフロントエンドで使用）
- `Negative prompt`: ネガティブプロンプト（一部のフロントエンドで使用）
- `Parameters`: パラメータ（一部のフロントエンドで使用）
- `Comment`: JSON形式のメタデータ（A1111 WebUIで使用）

## パラメータの例

```
masterpiece, best quality, 1girl, blue eyes, white hair, baseball
Negative prompt: lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry
Steps: 20, Sampler: Euler a, CFG scale: 7, Seed: 1234567890, Size: 512x512, Model hash: 1234567890, Model: modelName
```

## ネガティブプロンプトの抽出

ネガティブプロンプトは、パラメータ文字列内で「Negative prompt:」の後に続く部分として格納されています。ネガティブプロンプトの終わりは、次のパラメータ（通常は「Steps:」など）の開始位置によって決まります。

ネガティブプロンプトの例：
```
loli,school uniform,ribbon,bad quality,worst quality,worst detail,sketch,censor,short sleeves,grey cardigan,pink cardigan,lapels,ahoge,blazer,jacket,chest pocket,black shirt,culottes,2 hair colours,2 balls,ahoge,blunt bangs,door,frame,nipples,invitation,logo,
```

ネガティブプロンプトを正確に抽出するためには、以下のステップが必要です：

1. パラメータ文字列を「Negative prompt:」で分割
2. 分割された2番目の部分から、次のパラメータの開始位置を特定
3. ネガティブプロンプト部分を抽出

一般的なパラメータの開始パターン：
- Steps:
- Sampler:
- CFG scale:
- Seed:
- Size:
- Model hash:
- Model:
- Denoising strength:
- Clip skip:

## 異なるフロントエンドでのメタデータの違い

異なるStable Diffusionのフロントエンドでは、メタデータの格納方法が異なる場合があります：

1. **Automatic1111 WebUI**: 
   - tEXtチャンクにプロンプト、ネガティブプロンプト、パラメータを格納
   - Commentキーに追加のJSONメタデータを格納することもある

2. **ComfyUI**:
   - tEXtチャンクにワークフロー情報を格納
   - プロンプト情報はパラメータに含まれる場合が多い

3. **NovelAI**:
   - iTXtチャンクにメタデータを格納
   - 独自の形式を使用

## メタデータの抽出方法

1. PNGファイルを読み込む
2. PNGシグネチャを確認
3. チャンクを順に読み込み、tEXtとiTXtチャンクを探す
4. 見つかったチャンクからメタデータを抽出
5. キーに基づいてメタデータを分類（プロンプト、ネガティブプロンプト、パラメータ）

## トラブルシューティング

### メタデータが見つからない場合

1. 画像がPNG形式であることを確認する
2. 画像がStable Diffusionなどの画像生成AIで生成されたものであることを確認する
3. 画像が編集されていないことを確認する（編集するとメタデータが失われる場合がある）
4. 画像が別の形式から変換されたものでないことを確認する

### 文字化けが発生する場合

1. テキストエンコーディングを確認する（UTF-8が一般的）
2. 特殊文字や絵文字が含まれている場合は、iTXtチャンクを確認する

### パフォーマンスの問題

1. 大きなファイルの場合、チャンクの読み込みに時間がかかる場合がある
2. ブラウザのメモリ制限に注意する

## 参考リンク

- [PNG仕様](http://www.libpng.org/pub/png/spec/1.2/PNG-Contents.html)
- [Automatic1111 WebUI GitHub](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- [ComfyUI GitHub](https://github.com/comfyanonymous/ComfyUI)
- [NovelAI](https://novelai.net/) 