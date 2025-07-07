// js/admin.js

/**
 * admin.html 頁面的主初始化函式。
 * 核心功能：驗證使用者是否為管理員，然後顯示對應的功能選單。
 */
async function initializeAdminPage() {
    console.log("Initializing Admin Page Logic...");

    // === DOM 元素快取 ===
    const adminWelcome = document.getElementById('admin-welcome');
    const adminMenu = document.getElementById('admin-menu-container');

    // === 初始化與權限驗證 ===
    try {
        const liffProfile = await initializeLiff();
        if (!liffProfile) {
            if (adminWelcome) adminWelcome.textContent = 'LIFF 初始化失敗或未登入。';
            return;
        }

        const result = await callGasApi('getUserProfile', { userId: liffProfile.userId });

        if (result.status === 'found' && (result.data.status === '管理者' || result.data.status === '開發者')) {
            // 權限驗證通過
            if (adminWelcome) adminWelcome.textContent = `權限已確認，${result.data.name}。請選擇要執行的操作。`;
            if (adminMenu) adminMenu.style.display = 'block';

            // TODO: 在此處可以加入載入審核列表等其他管理功能的初始邏輯
            // 例如: loadPendingUsers();

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
}