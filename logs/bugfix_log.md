# バグ修正ログ

## 2023-03-15: ネガティブプロンプト抽出の修正

### 問題
ネガティブプロンプトの抽出ロジックに問題があり、完全なネガティブプロンプトが取得できていませんでした。具体的には、「Negative prompt:」の後の最初のカンマまでしか取得していなかったため、複数のネガティブプロンプト要素が含まれる場合に一部しか表示されませんでした。

### 修正内容
`pnginfo.js`ファイルの`assignMetadata`メソッド内のネガティブプロンプト抽出ロジックを修正しました：

1. 「Negative prompt:」でパラメータを分割
2. ネガティブプロンプト部分の終わりを検出するために、一般的なパラメータの開始パターン（Steps:, Size:, Seed:など）を探す
3. 見つかったパターンの位置までをネガティブプロンプトとして抽出

### 修正前のコード
```javascript
if (!metadata.prompt || !metadata.negativePrompt) {
    const paramParts = value.split('Negative prompt:');
    if (paramParts.length > 1) {
        const negAndRest = paramParts[1].split(',');
        if (!metadata.prompt && paramParts[0].trim()) {
            metadata.prompt = paramParts[0].trim();
        }
        if (!metadata.negativePrompt && negAndRest[0].trim()) {
            metadata.negativePrompt = negAndRest[0].trim();
        }
    }
}
```

### 修正後のコード
```javascript
if (!metadata.prompt || !metadata.negativePrompt) {
    // 「Negative prompt:」でパラメータを分割
    const negativePromptPrefix = 'Negative prompt:';
    const paramParts = value.split(negativePromptPrefix);
    
    if (paramParts.length > 1) {
        // プロンプト部分（最初の部分）を取得
        if (!metadata.prompt && paramParts[0].trim()) {
            metadata.prompt = paramParts[0].trim();
        }
        
        // ネガティブプロンプト部分を取得
        if (!metadata.negativePrompt) {
            // ネガティブプロンプトの後に続くパラメータを探す
            // 一般的なパラメータの開始パターン（Steps:, Size:, Seed:など）
            const paramPatterns = [
                'Steps:', 'Sampler:', 'CFG scale:', 'Seed:', 'Size:', 
                'Model hash:', 'Model:', 'Denoising strength:', 'Clip skip:'
            ];
            
            let negativePromptText = paramParts[1];
            let endOfNegativePrompt = negativePromptText.length;
            
            // パラメータパターンの位置を探す
            for (const pattern of paramPatterns) {
                const patternIndex = negativePromptText.indexOf(pattern);
                if (patternIndex !== -1 && patternIndex < endOfNegativePrompt) {
                    endOfNegativePrompt = patternIndex;
                }
            }
            
            // ネガティブプロンプト部分を切り出す
            metadata.negativePrompt = negativePromptText.substring(0, endOfNegativePrompt).trim();
        }
    }
}
```

### 効果
この修正により、ネガティブプロンプト全体が正しく抽出されるようになりました。例えば、以下のようなネガティブプロンプトが完全に表示されるようになります：

```
loli,school uniform,ribbon,bad quality,worst quality,worst detail,sketch,censor,short sleeves,grey cardigan,pink cardigan,lapels,ahoge,blazer,jacket,chest pocket,black shirt,culottes,2 hair colours,2 balls,ahoge,blunt bangs,door,frame,nipples,invitation,logo,
``` 