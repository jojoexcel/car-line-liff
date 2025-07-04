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
        
        // 判斷是否在 LINE App 外部
        const isExternalBrowser = (liff.getOS() !== 'web' && !liff.isInClient());

        if (!liff.isLoggedIn()) {
            statusMsg.textContent = '您尚未登入，將為您導向登入頁面...';
            logToScreen('User not logged in. Redirecting to login...');
            // 在外部瀏覽器登入時，指定跳轉回來的 URI
            liff.login({ redirectUri: window.location.href });
            return; // liff.login() 會跳轉頁面，後續程式碼不執行
        }
        
        statusMsg.textContent = '2. 正在取得使用者 Profile...';
        logToScreen('Getting user profile...');

        // 【關鍵修正】加上一個小小的延遲，給 SDK 反應時間
        // await new Promise(resolve => setTimeout(resolve, 50)); 
        // 經過測試，更穩健的方法是直接獲取 Access Token，這會強制 SDK 完成驗證流程
        
        const accessToken = liff.getAccessToken();
        if (!accessToken) {
            throw new Error('無法獲取 Access Token，請嘗試重新登入。');
        }
        logToScreen('Access Token acquired.');

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
