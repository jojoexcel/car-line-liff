// ==================【請修改這裡的設定】==================
const LIFF_ID = '2007626718-yQALkZm8'; // 等下步驟三會取得
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxnTa13Y2fOUXVlslYU8BQD-lfkW6XJ9WqsjDO5AhKM7leXVRrpvRXk90v5yAKrSmS4/exec'; // 貼上你在步驟一取得的網址
// =======================================================

// 為了方便除錯，建立一個函式將訊息顯示在畫面上
function logToScreen(message) {
    const userDataElem = document.getElementById('user-data');
    const logEntry = document.createElement('p');
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    userDataElem.prepend(logEntry); // 將新訊息加到最前面
}

async function main() {
    const statusMsg = document.getElementById('status-message');
    const userIdElem = document.getElementById('user-id');
    
    try {
        statusMsg.textContent = '1. 正在初始化 LIFF...';
        logToScreen('Initializing LIFF...');
        await liff.init({ liffId: LIFF_ID });

        if (!liff.isLoggedIn()) {
            statusMsg.textContent = '您尚未登入，將為您導向登入頁面...';
            logToScreen('User not logged in. Redirecting to login...');
            liff.login();
            return;
        }
        
        statusMsg.textContent = '2. 正在取得 LINE Profile...';
        logToScreen('Getting LINE profile...');
        const profile = await liff.getProfile();
        
        // 【關鍵防呆機制】檢查 profile 和 profile.userId 是否存在
        if (!profile || !profile.userId) {
            throw new Error('無法取得有效的 LINE Profile 或 User ID。');
        }

        const userId = profile.userId;
        userIdElem.textContent = userId;
        logToScreen(`Successfully got User ID: ${userId}`);

        // --- 核心測試：呼叫 GAS API ---
        statusMsg.textContent = '3. 正在呼叫後端 API...';
        logToScreen(`Calling GAS API with userId: ${userId}`);
        
        const url = new URL(GAS_API_URL);
        url.searchParams.append('action', 'getUserProfile');
        url.searchParams.append('userId', userId); // 使用我們已驗證過的 userId 變數
        
        logToScreen(`Request URL: ${url.toString()}`);

        const response = await fetch(url);
        
        logToScreen(`API response status: ${response.status}`);

        // 檢查 HTTP 回應是否成功 (2xx 狀態碼)
        if (!response.ok) {
            throw new Error(`後端 API 回應錯誤，狀態碼: ${response.status}`);
        }

        const result = await response.json();
        logToScreen(`API response JSON: ${JSON.stringify(result)}`);

        if (result.status === 'success') {
            statusMsg.textContent = '測試成功！ ✅';
            logToScreen('Process completed successfully!');
            // 使用 JSON.stringify 美化輸出
            document.getElementById('user-data').textContent = JSON.stringify(result.data, null, 2);
        } else {
            // 如果後端回傳的 JSON 內容是 error 狀態
            throw new Error(`後端回報錯誤: ${result.message}`);
        }

    } catch (error) {
        statusMsg.textContent = '發生錯誤 ❌';
        logToScreen(`Error caught: ${error.message}`);
        console.error(error);
    }
}

// 確保 DOM 都載入完成後再執行 main 函式
document.addEventListener('DOMContentLoaded', main);
