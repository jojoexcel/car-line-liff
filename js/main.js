// ==================【請確認這裡的設定】==================
const LIFF_ID = '2007626718-yQALkZm8'; // 您的 LIFF ID
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxnTa13Y2fOUXVlslYU8BQD-lfkW6XJ9WqsjDO5AhKM7leXVRrpvRXk90v5yAKrSmS4/exec'; // 您的 GAS 網址
// =======================================================

/**
 * 將日誌訊息顯示在畫面上，方便在手機上除錯。
 * @param {string} message - 要顯示的訊息。
 * @param {string} type - 'info' (藍色) 或 'error' (紅色)。
 */
function logToScreen(message, type = 'info') {
    const logArea = document.getElementById('log-area');
    if (!logArea) return;

    const logEntry = document.createElement('div');
    logEntry.style.color = type === 'error' ? 'red' : 'blue';
    logEntry.style.borderBottom = '1px dotted #ccc';
    logEntry.style.padding = '2px 0';
    logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    logArea.prepend(logEntry);
}

/**
 * 主執行函式
 */
async function main() {
    const statusMsg = document.getElementById('status-message');
    
    try {
        logToScreen('1. Initializing LIFF...');
        await liff.init({ liffId: LIFF_ID });

        logToScreen(`LIFF initialized. OS: ${liff.getOS()}, Is in client: ${liff.isInClient()}`);

        if (!liff.isLoggedIn()) {
            statusMsg.textContent = '狀態：尚未登入，將導向登入頁...';
            logToScreen('Not logged in. Calling liff.login()...');
            // 指定 redirectUri 確保登入後能正確跳轉回來
            liff.login({ redirectUri: window.location.href });
            // liff.login() 會跳轉頁面，後續程式碼不會執行，所以在這裡結束
            return;
        }

        statusMsg.textContent = '狀態：已登入，正在獲取使用者資料...';
        logToScreen('Logged in. Getting access token...');

        const accessToken = liff.getAccessToken();
        if (!accessToken) {
            // 這個情況很少見，但以防萬一
            throw new Error('Logged in but could not get Access Token. Please try clearing cache or re-logging in.');
        }
        logToScreen('Access Token acquired.');

        logToScreen('Getting user profile...');
        const profile = await liff.getProfile();
        
        if (!profile || !profile.userId) {
            throw new Error('Could not get a valid user profile.');
        }

        const userId = profile.userId;
        document.getElementById('user-id').textContent = userId;
        document.getElementById('display-name').textContent = profile.displayName;
        logToScreen(`Success! User ID: ${userId}, Name: ${profile.displayName}`);

        statusMsg.textContent = '狀態：正在從後端獲取詳細資料...';
        logToScreen(`Calling GAS API for user: ${userId}`);
        
        const url = new URL(GAS_API_URL);
        url.searchParams.append('action', 'getUserProfile');
        url.searchParams.append('userId', userId);
        
        const response = await fetch(url);
        logToScreen(`GAS API response status: ${response.status}`);

        if (!response.ok) {
            throw new Error(`GAS API returned an error: ${response.status}`);
        }

        const result = await response.json();
        logToScreen(`GAS API response data: ${JSON.stringify(result)}`);

        if (result.status === 'success') {
            statusMsg.textContent = '測試成功！✅';
            const dataArea = document.getElementById('api-data');
            dataArea.textContent = JSON.stringify(result.data, null, 2);
        } else {
            throw new Error(`GAS API reported an error: ${result.message}`);
        }

    } catch (error) {
        statusMsg.textContent = '發生錯誤 ❌';
        logToScreen(`FATAL ERROR: ${error.message}`, 'error');
        console.error(error);
    }
}

// 監聽 DOMContentLoaded 事件，確保頁面元素都載入後再執行
document.addEventListener('DOMContentLoaded', main);
