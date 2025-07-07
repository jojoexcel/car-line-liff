// js/loader.js (回呼版)

/**
 * 動態載入一個帶有全域版本號的 CSS 檔案。
 */
function loadCSS(path) {
    if (typeof GLOBAL_CACHE_VERSION === 'undefined') {
        console.error('GLOBAL_CACHE_VERSION is not defined!');
        return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${path}?v=${GLOBAL_CACHE_VERSION}`;
    document.head.appendChild(link);
}

/**
 * 動態、依序載入一個或多個 JS 檔案，並在全部完成後執行回呼函式。
 * @param {Array<string>} paths - JS 路徑的陣列
 * @param {function} callback - 所有腳本載入完成後要執行的函式
 */
function loadJS(paths, callback) {
    if (typeof GLOBAL_CACHE_VERSION === 'undefined') {
        console.error('GLOBAL_CACHE_VERSION is not defined!');
        return;
    }

    const pathsArray = Array.isArray(paths) ? paths : [paths];
    let loadedCount = 0;

    function loadScript(index) {
        if (index >= pathsArray.length) {
            // 所有腳本都已載入，執行回呼
            if (callback && typeof callback === 'function') {
                callback();
            }
            return;
        }

        const path = pathsArray[index];
        const script = document.createElement('script');
        script.src = `${path}?v=${GLOBAL_CACHE_VERSION}`;
        
        script.onload = () => {
            console.log(`${path} loaded successfully.`);
            // 載入下一個腳本
            loadScript(index + 1);
        };
        script.onerror = () => {
            console.error(`Failed to load script: ${path}`);
            // 即使某個腳本失敗，也嘗試載入下一個，或者直接報錯
            loadScript(index + 1);
        };
        document.body.appendChild(script);
    }

    // 從第一個腳本開始載入
    loadScript(0);
}
