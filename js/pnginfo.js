/**
 * PNGinfoを抽出するためのユーティリティクラス
 */
class PNGInfoExtractor {
    /**
     * PNGファイルからメタデータを抽出する
     * @param {File} file - 解析するPNGファイル
     * @returns {Promise<Object>} 抽出されたメタデータ
     */
    static async extract(file) {
        try {
            Logger.log('info', 'PNGファイルの解析を開始します', { filename: file.name });
            
            // ファイルがPNGかどうかを確認
            if (!file.type.match('image/png')) {
                throw new Error('ファイル形式がPNGではありません');
            }
            
            // ファイルを読み込む
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            const chunks = await this.extractChunks(arrayBuffer);
            
            // tEXtチャンクを探す
            const textChunks = chunks.filter(chunk => chunk.type === 'tEXt');
            const iTXtChunks = chunks.filter(chunk => chunk.type === 'iTXt');
            
            // メタデータを抽出
            const metadata = this.parseMetadata(textChunks, iTXtChunks);
            
            Logger.log('info', 'PNGファイルの解析が完了しました', { filename: file.name });
            return metadata;
        } catch (error) {
            Logger.log('error', 'PNGファイルの解析中にエラーが発生しました', { 
                error: error.message,
                filename: file.name
            });
            throw error;
        }
    }
    
    /**
     * ファイルをArrayBufferとして読み込む
     * @param {File} file - 読み込むファイル
     * @returns {Promise<ArrayBuffer>} ファイルの内容
     */
    static readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
            reader.readAsArrayBuffer(file);
        });
    }
    
    /**
     * PNGファイルからチャンクを抽出する
     * @param {ArrayBuffer} arrayBuffer - PNGファイルのデータ
     * @returns {Array<Object>} 抽出されたチャンク
     */
    static async extractChunks(arrayBuffer) {
        const dataView = new DataView(arrayBuffer);
        const chunks = [];
        
        // PNGシグネチャをチェック (89 50 4E 47 0D 0A 1A 0A)
        const signature = [137, 80, 78, 71, 13, 10, 26, 10];
        for (let i = 0; i < 8; i++) {
            if (dataView.getUint8(i) !== signature[i]) {
                throw new Error('無効なPNGファイルです');
            }
        }
        
        // チャンクを解析
        let offset = 8; // シグネチャの後から開始
        
        while (offset < dataView.byteLength) {
            // チャンクの長さを取得
            const length = dataView.getUint32(offset);
            offset += 4;
            
            // チャンクタイプを取得
            const typeBytes = new Uint8Array(arrayBuffer.slice(offset, offset + 4));
            const type = String.fromCharCode(...typeBytes);
            offset += 4;
            
            // チャンクデータを取得
            const data = new Uint8Array(arrayBuffer.slice(offset, offset + length));
            offset += length;
            
            // CRCを取得（今回は使用しない）
            offset += 4;
            
            chunks.push({ type, data });
            
            // IENDチャンクに達したら終了
            if (type === 'IEND') {
                break;
            }
        }
        
        return chunks;
    }
    
    /**
     * チャンクからメタデータを解析する
     * @param {Array<Object>} textChunks - tEXtチャンク
     * @param {Array<Object>} iTXtChunks - iTXtチャンク
     * @returns {Object} 解析されたメタデータ
     */
    static parseMetadata(textChunks, iTXtChunks) {
        const metadata = {
            prompt: '',
            negativePrompt: '',
            parameters: ''
        };
        
        // tEXtチャンクを処理
        for (const chunk of textChunks) {
            const nullIndex = chunk.data.indexOf(0);
            if (nullIndex === -1) continue;
            
            const key = new TextDecoder().decode(chunk.data.slice(0, nullIndex));
            const value = new TextDecoder().decode(chunk.data.slice(nullIndex + 1));
            
            this.assignMetadata(metadata, key, value);
        }
        
        // iTXtチャンクを処理
        for (const chunk of iTXtChunks) {
            try {
                const nullIndex = chunk.data.indexOf(0);
                if (nullIndex === -1) continue;
                
                const key = new TextDecoder().decode(chunk.data.slice(0, nullIndex));
                
                // iTXtチャンクのフォーマット: キーワード + NULL + 圧縮フラグ + 圧縮方法 + 言語タグ + NULL + 翻訳キーワード + NULL + テキスト
                let currentIndex = nullIndex + 1;
                const compressionFlag = chunk.data[currentIndex];
                currentIndex++;
                const compressionMethod = chunk.data[currentIndex];
                currentIndex++;
                
                // 言語タグをスキップ
                const langTagNullIndex = chunk.data.indexOf(0, currentIndex);
                if (langTagNullIndex === -1) continue;
                currentIndex = langTagNullIndex + 1;
                
                // 翻訳キーワードをスキップ
                const transKeywordNullIndex = chunk.data.indexOf(0, currentIndex);
                if (transKeywordNullIndex === -1) continue;
                currentIndex = transKeywordNullIndex + 1;
                
                // テキストを取得
                let value;
                if (compressionFlag === 1) {
                    // 圧縮されたテキスト（現在はサポートしていない）
                    value = '[圧縮されたテキスト - サポートされていません]';
                } else {
                    // 非圧縮テキスト
                    value = new TextDecoder().decode(chunk.data.slice(currentIndex));
                }
                
                this.assignMetadata(metadata, key, value);
            } catch (error) {
                Logger.log('warning', 'iTXtチャンクの解析中にエラーが発生しました', { error: error.message });
                continue;
            }
        }
        
        return metadata;
    }
    
    /**
     * キーと値に基づいてメタデータを割り当てる
     * @param {Object} metadata - メタデータオブジェクト
     * @param {string} key - メタデータのキー
     * @param {string} value - メタデータの値
     */
    static assignMetadata(metadata, key, value) {
        // Stable Diffusionの一般的なメタデータキー
        if (key === 'prompt' || key === 'Description') {
            metadata.prompt = value;
        } else if (key === 'negativePrompt' || key === 'Negative prompt') {
            metadata.negativePrompt = value;
        } else if (key === 'parameters' || key === 'Parameters') {
            metadata.parameters = value;
            
            // パラメータからプロンプトとネガティブプロンプトを抽出（バックアップ）
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
        } else if (key === 'Comment') {
            // A1111 WebUIのコメントフィールドからの抽出を試みる
            try {
                const commentData = JSON.parse(value);
                if (commentData.prompt && !metadata.prompt) {
                    metadata.prompt = commentData.prompt;
                }
                if (commentData.negative && !metadata.negativePrompt) {
                    metadata.negativePrompt = commentData.negative;
                }
            } catch (e) {
                // JSONではない場合は無視
            }
        }
    }
} 