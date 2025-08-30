// js/version.js
// 這是我們唯一的、全域的版本號控制中心。
// 每次有重大更新時，只需要修改這個檔案裡的數字即可。
const GLOBAL_CACHE_VERSION = '1.4.10'
/**
 * 產生帶有版本號的 URL
 * @param {string} path - 相對路徑, e.g., 'profile.html' or './css/style.css'
 * @returns {string} - e.g., 'profile.html?v=1.3.2'
 */
function versionedUrl(path) {
    // 確保路徑中沒有舊的版本號
    const cleanPath = path.split('?')[0];
    return `${cleanPath}?v=${GLOBAL_CACHE_VERSION}`;
}
