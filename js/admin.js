/**
 * 檔案說明：管理者功能主頁 (admin.html) 的主要邏輯。
 * 核心功能：驗證使用者是否為管理員，然後顯示對應的功能選單。
 * 版本：2.0 (格式化與錯誤處理強化版)
 */
async function initializeAdminPage() {

    console.log("Initializing Admin Page Logic...");

    // 1. 獲取所有需要操作的 HTML 元素
    const authPanel = document.getElementById('auth-panel');
    const managementPanel = document.getElementById('admin-menu-container');

    // 確保關鍵的 authPanel 存在，否則後續操作無意義
    if (!authPanel) {
        console.error("Fatal Error: HTML element with id 'auth-panel' not found.");
        return;
    }

    try {
        // 2. 初始化 LIFF 並獲取使用者 LINE Profile
        const liffProfile = await initializeLiff();

        // 如果 initializeLiff() 失敗或需要登入，它會回傳 null
        if (!liffProfile) {
            // initializeLiff 內部出錯時會自己彈出提示，這裡只需更新 UI 即可
            authPanel.textContent = 'LIFF 初始化失敗，請重新整理頁面。';
            return;
        }

        // 3. 呼叫後端 API，獲取使用者在我們系統中的資料 (包含 status)
        const result = await callGasApi('getUserProfile', { userId: liffProfile.userId });

        // 4. 檢查從後端回傳的結果是否有效
        if (!result || !result.status) {
            // 如果 callGasApi 內部出錯，它會自己彈出提示，這裡只更新 UI
            authPanel.textContent = '無法從後端獲取您的資料，請稍後再試。';
            return;
        }

        // 5. 根據使用者狀態，決定顯示內容
        if (result.status === 'found' && (result.data.status === '管理者' || result.data.status === '開發者')) {
            // --- 權限驗證通過 ---

            // 隱藏「驗證中」的面板
            authPanel.style.display = 'none';
            // 顯示真正的管理員選單
            if (managementPanel) {
                managementPanel.style.display = 'block';
            }

            // TODO: 在此處可以加入載入其他管理功能的初始邏輯
            // 例如: loadDashboardData();

        } else {
            // --- 權限不足 ---

            // 無論是找不到使用者(not_found)，還是一般使用者，都視為權限不足
            authPanel.style.color = 'var(--error-color)';
            authPanel.innerHTML = '<p>權限不足！</p><small>此頁面僅供管理員使用，或您的帳號尚未在系統中建立資料。</small>';
        }

    } catch (error) {
        // 6. 捕捉任何在 try 區塊中未被預期的錯誤
        console.error("A critical error occurred in initializeAdminPage:", error);
        authPanel.style.color = 'var(--error-color)';
        authPanel.textContent = `發生嚴重錯誤，請聯繫開發人員。(${error.message})`;
    }
}