// js/main.js
const LIFF_ID = '2007626718-yQALkZm8';
// const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxnTa13Y2fOUXVlslYU8BQD-lfkW6XJ9WqsjDO5AhKM7leXVRrpvRXk90v5yAKrSmS4/exec';

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwP8pTidweijb7GqbfCS8B02gGak8sPnTvuhL1-RWTw5WXW4z32gieoU5KVKdDtcj2g/exec';

function showLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) loading.style.display = 'flex';
}
function hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) loading.style.display = 'none';
}
function showModalAlert(message, title = '系統訊息') {
    const alertModal = document.getElementById('custom-alert-modal');
    const alertText = document.getElementById('alert-text');
    const alertTitle = document.getElementById('alert-title');
    const alertOkBtn = document.getElementById('alert-ok-btn');
    if (alertModal && alertText && alertTitle && alertOkBtn) {
        alertTitle.textContent = title;
        alertText.textContent = message;
        alertOkBtn.onclick = null;
        alertOkBtn.onclick = () => { alertModal.style.display = 'none'; };
        alertModal.style.display = 'flex';
    } else {
        alert(message);
    }
}
function showModalConfirm(message, title = '確認操作') {
    const confirmModal = document.getElementById('custom-confirm-modal');
    const confirmText = document.getElementById('confirm-text');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmOkBtn = document.getElementById('confirm-ok-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    return new Promise((resolve) => {
        if (!confirmModal || !confirmText || !confirmTitle || !confirmOkBtn || !confirmCancelBtn) {
            resolve(confirm(message));
            return;
        }
        confirmTitle.textContent = title;
        confirmText.textContent = message;
        confirmModal.style.display = 'flex';
        confirmOkBtn.onclick = () => { confirmModal.style.display = 'none'; resolve(true); };
        confirmCancelBtn.onclick = () => { confirmModal.style.display = 'none'; resolve(false); };
    });
}
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
        showModalAlert('LIFF 初始化失敗，請嘗試重新整理頁面。', '初始化錯誤');
        return null;
    } finally {
        hideLoading();
    }
}
async function callGasApi(action, params = {}) {
    showLoading();
    try {
        const url = new URL(GAS_API_URL);
        url.searchParams.append('action', action);
        for (const key in params) { url.searchParams.append(key, params[key]); }
        const response = await fetch(url);
        if (!response.ok) { throw new Error(`API 請求失敗: ${response.status}`); }
        return await response.json();
    } catch (error) {
        console.error('API Call failed', error);
        showModalAlert(`無法連接到後端伺服器: ${error.message}`, '網路錯誤');
        return { status: 'error', message: error.message };
    } finally {
        hideLoading();
    }
}
