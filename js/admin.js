// js/admin.js

/**
 * admin.html 頁面的主初始化函式。
 */
async function initializeAdminPage() {
    console.log("Initializing Admin Page Logic...");

    // === DOM 元素快取 ===
    const adminWelcome = document.getElementById('admin-welcome');
    const adminMenu = document.getElementById('admin-menu-container');
    // 未來會新增更多元素，例如使用者列表的 div

    // === 變數 ===
    let liffProfile = null;
    let userSystemProfile = null;

    // === 初始化與權限驗證 ===
    try {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;

        const result = await callGasApi('getUserProfile', { userId: liffProfile.userId });

        if (result.status === 'found' && (result.data.status === '管理者' || result.data.status === '開發者')) {
            userSystemProfile = result.data;
            // 權限驗證通過
            if (adminWelcome) adminWelcome.textContent = `權限已確認，${userSystemProfile.name}。請選擇要執行的操作。`;
            if (adminMenu) adminMenu.style.display = 'block';

            // 【未來擴充】在這裡呼叫獲取待審核使用者的函式
            // loadPendingUsers();
        } else {
            // 權限不足
            if (adminWelcome) {
                adminWelcome.style.color = 'var(--error-color)';
                adminWelcome.textContent = '權限不足！此頁面僅供管理員使用。';
            }
        }
    } catch (error) {
        console.error("Admin page initialization failed:", error);
        if (adminWelcome) adminWelcome.textContent = '驗證權限時發生錯誤。';
    }

    // === 事件處理函式與事件綁定 ===
    // 未來會在這裡新增處理「通過」、「拒絕」按鈕的點擊事件

}