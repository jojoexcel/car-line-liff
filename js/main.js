// ==================【請確認這裡的設定】==================
const LIFF_ID = '2007626718-yQALkZm8'; // 您的 LIFF ID
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxnTa13Y2fOUXVlslYU8BQD-lfkW6XJ9WqsjDO5AhKM7leXVRrpvRXk90v5yAKrSmS4/exec'; // 您的 GAS 網址
// =======================================================

function logToScreen(message) {
    const userDataElem = document.getElementById('user-data');
    if (!userDataElem) return;
    const logEntry = document.createElement('p');
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    userDataElem.prepend(logEntry);
}

async function main() {
    const statusMsg = document.getElementById('status-message');
    const userIdElem = document.getElementById('user-id');
    
    try {
        statusMsg.textContent = '1. 正在初始化 LIFF...';
        logToScreen('Initializing LIFF...');
        await liff.init({ liffId: LIFF_ID });

        // 【關鍵修正】處理外部瀏覽器登入後的重新導向
        // 這會移除 URL 中多餘的 liff.state 參數，防止無限迴圈
        if (liff.getOS() !== 'web' && liff.isInClient()) {
           logToScreen('Running inside LINE client.');
        } else {
           logToScreen('Running in external browser.');
           const dest = `${location.origin}${location.pathname}`;
           if (location.href !== dest) {
               history.replaceState({}, '', dest);
               logToScreen(`URL cleaned. Reloading page...`);
               // 有時需要重新載入來讓 LIFF SDK 重新識別狀態
               // window.location.reload(); 
               // 暫時先不自動重載，看是否能直接運作
           }
        }

        if (!liff.isLoggedIn()) {
            statusMsg.textContent = '您尚未登入，將為您導向登入頁面...';
            logToScreen('User not logged in. Redirecting to login...');
            liff.login({ redirectUri: window.location.href });
            return;
        }
        
        statusMsg.textContent = '2. 正在取得使用者 Profile...';
        logToScreen('Getting LINE profile...');
        const profile = await liff.getProfile();
        
        if (!profile || !profile.userId) {
            throw new Error('無法取得有效的 LINE Profile 或 User ID。');
        }

        const userId = profile.userId;
        userIdElem.textContent = userId;
        logToScreen(`Successfully got User ID: ${userId}`);

        statusMsg.textContent = '3. 正在呼叫後端 API...';
        logToScreen(`Calling GAS API with userId: ${userId}`);
        
        const url = new URL(GAS_API_URL);
        url.searchParams.append('action', 'getUserProfile');
        url.searchParams.append('userId', userId);
        
        logToScreen(`Request URL: ${url.toString()}`);
        const response = await fetch(url);
        logToScreen(`API response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`後端 API 回應錯誤，狀態碼: ${response.status}. 內容: ${errorText}`);
        }

        const result = await response.json();
        logToScreen(`API response JSON: ${JSON.stringify(result)}`);

        if (result.status === 'success') {
            statusMsg.textContent = '測試成功！ ✅';
            logToScreen('Process completed successfully!');
            const userDataElem = document.getElementById('user-data');
            userDataElem.innerHTML = '';
            userDataElem.textContent = JSON.stringify(result.data, null, 2);
        } else {
            throw new Error(`後端回報錯誤: ${result.message}`);
        }

    } catch (error) {
        statusMsg.textContent = '發生錯誤 ❌';
        logToScreen(`Error caught: ${error.message}`);
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', main);
