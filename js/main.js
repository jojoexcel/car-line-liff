// js/main.js

// --- 全域設定 ---
const LIFF_ID = '2007626718-yQALkZm8'; // 您的 LIFF ID
// const LIFF_ID = '2007626718-DBoB9k43';
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxnTa13Y2fOUXVlslYU8BQD-lfkW6XJ9WqsjDO5AhKM7leXVRrpvRXk90v5yAKrSmS4/exec'; // 您的 GAS 網址

/**
 * 顯示載入中的遮罩
 */
function showLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) loading.style.display = 'flex';
}

/**
 * 隱藏載入中的遮罩
 */
function hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) loading.style.display = 'none';
}

/**
 * 初始化 LIFF 並取得使用者 Profile
 * @returns {Promise<object|null>} LIFF Profile 物件或 null
 */
async function initializeLiff() {
    showLoading();
    try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
            liff.login({ redirectUri: window.location.href });
            return null;
        }
        return await liff.getProfile();
    } catch (error) {
        console.error('LIFF Initialization failed', error);
        alert('LIFF 初始化失敗，請重新開啟頁面。');
        return null;
    } finally {
        hideLoading();
    }
}

/**
 * 呼叫後端 Google Apps Script API
 * @param {string} action - 要執行的動作
 * @param {object} params - 要傳遞的參數
 * @returns {Promise<object>} API 回應的 JSON 物件
 */
async function callGasApi(action, params = {}) {
    showLoading();
    try {
        const url = new URL(GAS_API_URL);
        url.searchParams.append('action', action);
        for (const key in params) {
            url.searchParams.append(key, params[key]);
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API 請求失敗，狀態碼: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Call failed', error);
        alert(`無法連接到後端伺服器: ${error.message}`);
        return { status: 'error', message: error.message };
    } finally {
        hideLoading();
    }
}
