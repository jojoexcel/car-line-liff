// js/loader.js

/**
 * 動態載入一個帶有全域版本號的 CSS 檔案。
 * @param {string} path - CSS 檔案的路徑
 */
function loadCSS(path) {
    if (typeof GLOBAL_CACHE_VERSION === 'undefined') {
        console.error('GLOBAL_CACHE_VERSION is not defined! Make sure version.js is loaded first.');
        return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${path}?v=${GLOBAL_CACHE_VERSION}`;
    document.head.appendChild(link);
}

/**
 * 動態載入一個或多個帶有全域版本號的 JS 檔案。
 * @param {string|Array<string>} paths - 單一 JS 路徑或多個路徑的陣列
 */
function loadJS(paths) {
    if (typeof GLOBAL_CACHE_VERSION === 'undefined') {
        console.error('GLOBAL_CACHE_VERSION is not defined! Make sure version.js is loaded first.');
        return;
    }

    const pathsArray = Array.isArray(paths) ? paths : [paths];

    pathsArray.forEach(path => {
        const script = document.createElement('script');
        script.src = `${path}?v=${GLOBAL_CACHE_VERSION}`;
        // 我們將腳本設為非同步載入，但這對我們的應用影響不大
        // script.async = false; 
        document.body.appendChild(script);
    });
}
