
async function initializeIndexPage() {
            // 從 main.js 呼叫 initializeLiff，它會處理載入遮罩
            const liffProfile = await initializeLiff();

            const welcomeEl = document.getElementById('welcome-message');

            if (!liffProfile) {
                // 如果初始化失敗或需要登入，main.js 會處理，這裡只顯示最終訊息
                if (welcomeEl) welcomeEl.textContent = '載入失敗或需要登入';
                return;
            }

            // 顯示個人化的歡迎訊息
            if (welcomeEl) welcomeEl.textContent = `歡迎，${liffProfile.displayName}`;

            // 呼叫後端 API，檢查使用者身份，以決定是否顯示管理員按鈕
            try {
                const result = await callGasApi('getUserProfile', { userId: liffProfile.userId });

                if (result.status === 'found') {
                    const userStatus = result.data.status;

                    // 只有「管理者」或「開發者」才能看到按鈕
                    if (userStatus === '管理者' || userStatus === '開發者') {
                        const adminButton = document.getElementById('admin-menu-button');
                        if (adminButton) {
                            adminButton.style.display = 'flex'; // 使用 flex 以維持排版一致
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to get user profile for admin check:', error);
            }
        }

        // 執行初始化
        initializeIndexPage();