/**
 * PNGInfo抽出ツールのメインアプリケーションロジック
 */
document.addEventListener('DOMContentLoaded', () => {
    // ロガーの初期化
    Logger.setupCrashDetection();
    Logger.log('info', 'アプリケーションを起動しました');
    
    // DOM要素
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const resultContainer = document.getElementById('resultContainer');
    const imagePreview = document.getElementById('imagePreview');
    const promptText = document.getElementById('promptText');
    const negativePromptText = document.getElementById('negativePromptText');
    const parametersText = document.getElementById('parametersText');
    
    // コピーボタン
    const copyButtons = document.querySelectorAll('.copy-btn');
    
    // ドラッグ&ドロップイベント
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    
    // ファイル選択ボタン
    selectFileBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // アップロードエリアのクリックでもファイル選択
    uploadArea.addEventListener('click', (e) => {
        if (e.target !== selectFileBtn) {
            fileInput.click();
        }
    });
    
    // ファイル入力の変更
    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length) {
            handleFile(fileInput.files[0]);
        }
    });
    
    // コピーボタン
    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                copyToClipboard(targetElement.value);
                showNotification('テキストをクリップボードにコピーしました', 'success');
            }
        });
    });
    
    /**
     * ファイルを処理する
     * @param {File} file - 処理するファイル
     */
    async function handleFile(file) {
        try {
            Logger.log('info', 'ファイルが選択されました', { filename: file.name, size: file.size });
            
            // ファイルがPNGかどうかを確認
            if (!file.type.match('image/png')) {
                throw new Error('ファイル形式がPNGではありません');
            }
            
            // 画像プレビューを表示
            displayImagePreview(file);
            
            // PNGinfoを抽出
            const metadata = await PNGInfoExtractor.extract(file);
            
            // 結果を表示
            displayResults(metadata);
            
            // 結果コンテナを表示
            resultContainer.style.display = 'flex';
            
            Logger.log('info', 'PNGinfoの抽出が完了しました', { filename: file.name });
        } catch (error) {
            Logger.log('error', 'ファイル処理中にエラーが発生しました', { error: error.message });
            showNotification(`エラー: ${error.message}`, 'error');
            
            // エラーをMDファイルに記録
            saveErrorToMd(error);
        }
    }
    
    /**
     * 画像プレビューを表示
     * @param {File} file - 表示する画像ファイル
     */
    function displayImagePreview(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            
            // 既存の画像を削除
            imagePreview.innerHTML = '';
            imagePreview.appendChild(img);
        };
        
        reader.readAsDataURL(file);
    }
    
    /**
     * 抽出結果を表示
     * @param {Object} metadata - 抽出されたメタデータ
     */
    function displayResults(metadata) {
        promptText.value = metadata.prompt || 'プロンプト情報が見つかりませんでした';
        negativePromptText.value = metadata.negativePrompt || 'ネガティブプロンプト情報が見つかりませんでした';
        parametersText.value = metadata.parameters || 'パラメータ情報が見つかりませんでした';
        
        // テキストエリアの高さを自動調整
        autoResizeTextarea(promptText);
        autoResizeTextarea(negativePromptText);
        autoResizeTextarea(parametersText);
    }
    
    /**
     * テキストエリアの高さを自動調整
     * @param {HTMLTextAreaElement} textarea - 調整するテキストエリア
     */
    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }
    
    /**
     * テキストをクリップボードにコピー
     * @param {string} text - コピーするテキスト
     */
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => {
                Logger.log('info', 'テキストをクリップボードにコピーしました');
            })
            .catch(error => {
                Logger.log('error', 'クリップボードへのコピーに失敗しました', { error: error.message });
            });
    }
    
    /**
     * 通知を表示
     * @param {string} message - 表示するメッセージ
     * @param {string} type - 通知タイプ ('success', 'error', 'info')
     */
    function showNotification(message, type = 'info') {
        // 既存の通知を削除
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 新しい通知を作成
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 通知を追加
        document.body.appendChild(notification);
        
        // アニメーションのためにタイミングをずらす
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 3秒後に通知を削除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    /**
     * エラーをMDファイルに記録
     * @param {Error} error - 記録するエラー
     */
    function saveErrorToMd(error) {
        try {
            const timestamp = new Date().toISOString();
            const errorText = `## エラー発生: ${timestamp}\n\n` +
                              `- **エラーメッセージ**: ${error.message}\n` +
                              `- **スタックトレース**:\n\`\`\`\n${error.stack || 'スタックトレースなし'}\n\`\`\`\n\n`;
            
            // ローカルストレージに保存されているエラーログを取得
            let errorLogs = localStorage.getItem('pnginfo_error_md') || '# PNGInfo抽出ツール エラーログ\n\n';
            errorLogs += errorText;
            
            // ローカルストレージに保存
            localStorage.setItem('pnginfo_error_md', errorLogs);
            
            // エラーログをダウンロード
            const blob = new Blob([errorLogs], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `pnginfo_error_log.md`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('エラーログのMDファイルへの保存に失敗しました:', e);
        }
    }
}); 