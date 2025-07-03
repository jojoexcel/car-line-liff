// ==================【請修改這裡的設定】==================
const LIFF_ID = '2007626718-yQALkZm8'; // 等下步驟三會取得
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxnTa13Y2fOUXVlslYU8BQD-lfkW6XJ9WqsjDO5AhKM7leXVRrpvRXk90v5yAKrSmS4/exec'; // 貼上你在步驟一取得的網址
// =======================================================

async function main() {
    const statusMsg = document.getElementById('status-message');
    const userIdElem = document.getElementById('user-id');
    const userDataElem = document.getElementById('user-data');

    try {
        statusMsg.textContent = '正在初始化 LIFF...';
        await liff.init({ liffId: LIFF_ID });

        if (!liff.isLoggedIn()) {
            statusMsg.textContent = '您尚未登入，將為您導向登入頁面...';
            liff.login();
            return; // liff.login() 會跳轉頁面，後續程式碼不會執行
        }
        
        statusMsg.textContent = '正在取得 LINE Profile...';
        const profile = await liff.getProfile();
        
        userIdElem.textContent = profile.userId;

        // --- 核心測試：呼叫 GAS API ---
        statusMsg.textContent = '正在呼叫後端 API...';
        const url = new URL(GAS_API_URL);
        url.searchParams.append('action', 'getUserProfile');
        url.searchParams.append('userId', profile.userId);
        
        const response = await fetch(url);
        const result = await response.json();

        if (result.status === 'success') {
            statusMsg.textContent = '測試成功！ ✅';
            // 使用 JSON.stringify 美化輸出，方便除錯
            userDataElem.textContent = JSON.stringify(result.data, null, 2);
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        statusMsg.textContent = '發生錯誤 ❌';
        userDataElem.textContent = error.message;
        console.error(error);
    }
}

main();
