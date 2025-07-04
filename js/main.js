// ==================【請確認這裡的設定】==================
const LIFF_ID = '2007626718-yQALkZm8'; // 您的 LIFF ID
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxnTa13Y2fOUXVlslYU8BQD-lfkW6XJ9WqsjDO5AhKM7leXVRrpvRXk90v5yAKrSmS4/exec'; // 您的 GAS 網址
// =======================================================

/**
 * 將日誌訊息顯示在畫面上，方便在手機上除錯。
 * @param {string} message - 要顯示的訊息。
 */
function logToScreen(message) {
    const userDataElem = document.getElementById('user-data');
    if (!userDataElem) return; // 如果找不到元素，就直接返回

    const logEntry = document.createElement('p');
    // 加上時間戳，方便判斷執行順序
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    // 將新訊息插入到日誌區塊的最前面
    userDataElem.prepend(logEntry);
}

/**
 * 主執行函式
 */
async function main() {
    const statusMsg = document.getElementById('status-message');
    const userIdElem = document.getElementById('user-id');
    
    try {
        // --- 步驟 1: 初始化 LIFF ---
        statusMsg.textContent = '1. 正在初始化 LIFF...';
        logToScreen('Initializing LIFF...');
        await liff.init({ liffId: LIFF_ID });

        if (!liff.isLoggedIn()) {
            statusMsg.textContent = '您尚未登入，將為您導向登入頁面...';
            logToScreen('User not logged in. Redirecting to login...');
            liff.login();
            return; // liff.login() 會跳轉頁面，後續程式碼不會執行
        }
        
        // --- 步驟 2: 取得使用者 Profile ---
        statusMsg.textContent = '2. 正在取得 LINE Profile...';
        logToScreen('Getting LINE profile...');
        const profile = await liff.getProfile();
        
        // 【關鍵防呆】檢查 profile 和 profile.userId 是否真的存在
        if (!profile || !profile.userId) {
            throw new Error('無法取得有效的 LINE Profile 或 User ID。');
        }

        const userId = profile.userId;
        userIdElem.textContent = userId;
        logToScreen(`Successfully got User ID: ${userId}`);

        // --- 步驟 3: 呼叫後端 API ---
        statusMsg.textContent = '3. 正在呼叫後端 API...';
        logToScreen(`Calling GAS API with userId: ${userId}`);
        
        const url = new URL(GAS_API_URL);
        url.searchParams.append('action', 'getUserProfile');
        url.searchParams.append('userId', userId); // 只需附加一次 userId
        
        logToScreen(`Request URL: ${url.toString()}`);

        const response = await fetch(url);
        
        logToScreen(`API response status: ${response.status}`);

        // 檢查 HTTP 回應是否成功 (2xx 以外的狀態碼都視為錯誤)
        if (!response.ok) {
            throw new Error(`後端 API 回應錯誤，狀態碼: ${response.status}`);
        }

        const result = await response.json();
        logToScreen(`API response JSON: ${JSON.stringify(result)}`);

        // --- 步驟 4: 處理 API 回應並更新畫面 ---
        if (result.status === 'success') {
            statusMsg.textContent = '測試成功！ ✅';
            logToScreen('Process completed successfully!');
            // 將日誌區塊的內容清空，並顯示格式化後的 JSON 結果
            const userDataElem = document.getElementById('user-data');
            userDataElem.innerHTML = ''; // 清空日誌
            userDataElem.textContent = JSON.stringify(result.data, null, 2);
        } else {
            // 如果後端回傳的 JSON 內容中，status 不是 'success'
            throw new Error(`後端回報錯誤: ${result.message}`);
        }

    } catch (error) {
        statusMsg.textContent = '發生錯誤 ❌';
        // 在日誌區塊和 console 都顯示錯誤訊息
        logToScreen(`Error caught: ${error.message}`);
        console.error(error);
    }
}

// 監聽 DOMContentLoaded 事件，確保 HTML 頁面元素都載入完成後，才執行我們的 main 函式。
// 這是最標準、最穩定的做法。
document.addEventListener('DOMContentLoaded', main);
