/**
 * アプリケーションのロギング機能を提供するクラス
 */
class Logger {
    // ログレベル
    static LEVELS = {
        debug: 0,
        info: 1,
        warning: 2,
        error: 3,
        fatal: 4
    };
    
    // 現在のログレベル（これ以上のレベルのみ記録）
    static currentLevel = Logger.LEVELS.info;
    
    // ログ履歴
    static logs = [];
    
    // 最大ログ数
    static MAX_LOGS = 1000;
    
    /**
     * ログを記録する
     * @param {string} level - ログレベル ('debug', 'info', 'warning', 'error', 'fatal')
     * @param {string} message - ログメッセージ
     * @param {Object} [data] - 追加データ
     */
    static log(level, message, data = {}) {
        // レベルが現在のログレベル以上の場合のみ記録
        if (Logger.LEVELS[level] >= Logger.currentLevel) {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level,
                message,
                data
            };
            
            // ログをメモリに保存
            Logger.logs.push(logEntry);
            
            // 最大ログ数を超えた場合、古いログを削除
            if (Logger.logs.length > Logger.MAX_LOGS) {
                Logger.logs.shift();
            }
            
            // ローカルストレージにも保存
            Logger.saveToLocalStorage();
            
            // コンソールにも出力
            this.consoleOutput(logEntry);
            
            // エラーの場合はエラーログファイルに記録
            if (level === 'error' || level === 'fatal') {
                Logger.saveErrorToFile(logEntry);
            }
        }
    }
    
    /**
     * コンソールにログを出力
     * @param {Object} logEntry - ログエントリ
     */
    static consoleOutput(logEntry) {
        const { timestamp, level, message, data } = logEntry;
        const formattedData = Object.keys(data).length > 0 ? JSON.stringify(data) : '';
        
        switch (level) {
            case 'debug':
                console.debug(`[${timestamp}] [DEBUG] ${message}`, formattedData);
                break;
            case 'info':
                console.info(`[${timestamp}] [INFO] ${message}`, formattedData);
                break;
            case 'warning':
                console.warn(`[${timestamp}] [WARNING] ${message}`, formattedData);
                break;
            case 'error':
            case 'fatal':
                console.error(`[${timestamp}] [${level.toUpperCase()}] ${message}`, formattedData);
                break;
        }
    }
    
    /**
     * ログをローカルストレージに保存
     */
    static saveToLocalStorage() {
        try {
            localStorage.setItem('pnginfo_logs', JSON.stringify(Logger.logs));
        } catch (error) {
            console.error('ログをローカルストレージに保存できませんでした:', error);
        }
    }
    
    /**
     * エラーログをファイルに保存
     * @param {Object} logEntry - ログエントリ
     */
    static saveErrorToFile(logEntry) {
        try {
            // エラーログをテキストとして整形
            const { timestamp, level, message, data } = logEntry;
            const formattedData = Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '';
            const errorText = `[${timestamp}] [${level.toUpperCase()}] ${message}\n${formattedData}\n\n`;
            
            // Blobを作成
            const blob = new Blob([errorText], { type: 'text/plain' });
            
            // ローカルストレージに保存されているエラーログを取得
            let errorLogs = localStorage.getItem('pnginfo_error_logs') || '';
            errorLogs += errorText;
            
            // ローカルストレージに保存
            localStorage.setItem('pnginfo_error_logs', errorLogs);
        } catch (error) {
            console.error('エラーログをファイルに保存できませんでした:', error);
        }
    }
    
    /**
     * エラーログをダウンロード
     */
    static downloadErrorLogs() {
        try {
            const errorLogs = localStorage.getItem('pnginfo_error_logs') || 'エラーログはありません';
            const blob = new Blob([errorLogs], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `pnginfo_error_logs_${new Date().toISOString().replace(/:/g, '-')}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('エラーログのダウンロードに失敗しました:', error);
        }
    }
    
    /**
     * ログをクリア
     */
    static clearLogs() {
        Logger.logs = [];
        localStorage.removeItem('pnginfo_logs');
    }
    
    /**
     * エラーログをクリア
     */
    static clearErrorLogs() {
        localStorage.removeItem('pnginfo_error_logs');
    }
    
    /**
     * アプリケーションの強制終了を検知するためのハンドラを設定
     */
    static setupCrashDetection() {
        // ページが閉じられる前にフラグを設定
        window.addEventListener('beforeunload', () => {
            sessionStorage.setItem('pnginfo_clean_exit', 'false');
            
            // 正常終了時にフラグをクリア
            setTimeout(() => {
                sessionStorage.removeItem('pnginfo_clean_exit');
            }, 0);
        });
        
        // ページ読み込み時にフラグをチェック
        window.addEventListener('load', () => {
            if (sessionStorage.getItem('pnginfo_clean_exit') === 'false') {
                Logger.log('warning', 'アプリケーションが前回正常に終了しませんでした。クラッシュが発生した可能性があります。');
                sessionStorage.removeItem('pnginfo_clean_exit');
            }
        });
    }
} 