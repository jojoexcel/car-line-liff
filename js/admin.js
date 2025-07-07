// js/admin.js (最終修正版)

/**
 * 檔案說明：管理者功能主頁 (admin.html) 的主要邏輯。
 * 核心功能：驗證管理者權限，並顯示功能選單和訊息額度。
 * 版本：2.1 (修正變數名稱不一致的錯誤)
 */
async function initializeAdminPage() {
    console.log("Initializing Admin Page Logic...");

    // 1. 獲取所有需要操作的 HTML 元素
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text'); // 在 info-panel 內的 p 標籤
    const managementPanel = document.getElementById('admin-menu-container');
    const quotaInfoElem = document.getElementById('quota-info');

    // 關鍵防呆：如果頁面的基礎結構不存在，直接報錯並終止
    if (!infoPanel || !infoText || !managementPanel || !quotaInfoElem) {
        console.error("Fatal Error: One or more required HTML elements are missing.");
        alert("頁面結構錯誤，無法載入管理功能。");
        return;
    }

    try {
        // 2. 初始化 LIFF
        const liffProfile = await initializeLiff();
        if (!liffProfile) {
            infoText.textContent = 'LIFF 初始化失敗，請重新整理頁面。';
            infoPanel.style.color = 'red';
            return;
        }

        // 3. 呼叫後端 API 驗證身份
        const result = await callGasApi('getUserProfile', { userId: liffProfile.userId });
        if (!result || !result.status) {
            infoText.textContent = '無法從後端獲取您的資料，請稍後再試。';
            infoPanel.style.color = 'red';
            return;
        }

        // 4. 根據使用者狀態決定顯示內容
        if (result.status === 'found' && (result.data.status === '管理者' || result.data.status === '開發者')) {
            // --- 權限驗證通過 ---
            infoPanel.style.display = 'none'; // 隱藏初始訊息面板
            managementPanel.style.display = 'block'; // 顯示管理員選單

            // 獲取並顯示訊息額度
            quotaInfoElem.style.display = 'block';
            quotaInfoElem.textContent = '正在讀取訊息額度...';

            const quotaResult = await callGasApi('getPushMessageCount');
            if (quotaResult.status === 'success') {
                const used = quotaResult.data.totalUsage;
                const freeLimit = 200; // 您可以將此設為常數或從後端獲取
                const remaining = freeLimit - used;
                quotaInfoElem.innerHTML = `本月 Push Message 已用: <strong>${used}</strong> / ${freeLimit} (剩餘 <strong>${remaining}</strong> 則)`;
            } else {
                quotaInfoElem.textContent = '無法獲取訊息額度資訊。';
                quotaInfoElem.style.backgroundColor = '#f8d7da';
            }

        } else {
            // --- 權限不足 ---
            infoPanel.style.color = 'var(--error-color)';
            infoText.innerHTML = '<strong>權限不足！</strong><br><small>此頁面僅供管理員使用。</small>';
        }

    } catch (error) {
        // 5. 捕捉任何未預期的錯誤
        console.error("A critical error occurred in initializeAdminPage:", error);
        infoPanel.style.display = 'block'; // 確保訊息面板可見
        infoPanel.style.color = 'var(--error-color)';
        infoText.innerHTML = `<strong>發生嚴重錯誤</strong><br><small>${error.message}</small>`;
    }
}