/**
 * 檔案說明：管理者專用的「使用者管理」頁面 (user-management.html) 的主要邏輯。
 * 核心功能：篩選、搜尋、審核、並管理所有使用者，並使用自訂的對話框提升體驗。
 * 版本：2.0 (自訂對話框版)
 */
async function initializeUserManagementPage() {
    console.log("Initializing User Management Page Logic...");

    // === DOM 元素快取 ===
    const authPanel = document.getElementById('auth-panel');
    const managementPanel = document.getElementById('management-panel');
    const userListElem = document.getElementById('user-list');
    const filterButtons = document.getElementById('filter-buttons');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    // 模態視窗相關元素
    const confirmModal = document.getElementById('custom-confirm-modal');
    const confirmText = document.getElementById('confirm-text');
    const confirmOkBtn = document.getElementById('confirm-ok-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const alertModal = document.getElementById('custom-alert-modal');
    const alertText = document.getElementById('alert-text');
    const alertOkBtn = document.getElementById('alert-ok-btn');

    // === 全域狀態變數 ===
    let currentFilter = 'pending'; // 預設篩選條件
    let resolveConfirm; // 用於儲存 Promise 的 resolve 函式，實現異步 confirm

    // === 權限驗證 ===
    // 這段程式碼會在最開始執行，確保只有管理者能繼續操作
    try {
        const liffProfile = await initializeLiff();
        if (!liffProfile) {
            authPanel.textContent = 'LIFF 初始化失敗或未登入。';
            return;
        }
        const adminProfile = await callGasApi('getUserProfile', { userId: liffProfile.userId });
        if (adminProfile.status !== 'found' || (adminProfile.data.status !== '管理者' && adminProfile.data.status !== '開發者')) {
            authPanel.textContent = '權限不足！此頁面僅供管理員使用。';
            return;
        }
        // 權限通過，顯示主操作介面
        authPanel.style.display = 'none';
        managementPanel.style.display = 'block';
    } catch (error) {
        authPanel.textContent = '權限驗證過程中發生錯誤。';
        console.error("Auth check failed:", error);
        return; // 驗證失敗則不繼續執行
    }


    // === 輔助函式 ===

    /**
     * 自訂的 alert 提示框。
     * @param {string} message 要顯示的訊息
     */
    function customAlert(message) {
        if (!alertModal || !alertText) return;
        alertText.textContent = message;
        alertModal.style.display = 'flex';
    }

    /**
     * 自訂的 confirm 確認框，使用 Promise 實現異步等待。
     * @param {string} message 要顯示的確認問題
     * @returns {Promise<boolean>} 使用者點擊「確定」則 resolve(true)，點擊「取消」則 resolve(false)
     */
    function customConfirm(message) {
        return new Promise((resolve) => {
            resolveConfirm = resolve; // 將 resolve 函式暴露到外部
            if (confirmText) confirmText.textContent = message;
            if (confirmModal) confirmModal.style.display = 'flex';
        });
    }

    /**
     * 根據使用者狀態，產生對應操作按鈕的 HTML 字串。
     * @param {string} status 使用者狀態
     * @returns {string} HTML 按鈕字串
     */
    function generateActionButtons(status) {
        if (status === '待審核') {
            return `<button class="approve-btn">✅ 通過</button><button class="reject-btn">❌ 拒絕</button>`;
        }
        if (status === '通過' || status === '管理者' || status === '開發者') {
            return `<button class="edit-btn">✏️ 編輯</button><button class="suspend-btn">🚫 停權</button>`;
        }
        if (status === '停權'|| status === '拒絕') {
            return `<button class="edit-btn">✏️ 編輯</button><button class="approve-btn">✅ 復權</button>`;
        }
        return '';
    }

    /**
     * 渲染從後端獲取的使用者列表。
     * @param {Array<object>} users 使用者資料陣列
     */
    /**
     * 渲染從後端獲取的使用者列表 (使用 LINE 預設頭像版)
     * @param {Array<object>} users 使用者資料陣列
     */
    function renderUserList(users) {
        if (!userListElem) return;
        userListElem.innerHTML = '';
        if (users.length === 0) {
            userListElem.innerHTML = '<p style="text-align: center; color: #888;">此分類下沒有使用者。</p>';
            return;
        }
        users.forEach(user => {
            const item = document.createElement('div');
            item.className = 'user-list-item';

            // 【關鍵修改】
            // 檢查 user.linePicUrl 是否存在且不為空。
            // 如果不存在，就使用我們自己專案中的預設頭像圖片路徑。
            const avatarUrl = user.linePicUrl || './images/default-avatar.png';

            item.innerHTML = `
                <img src="${avatarUrl}" alt="avatar" class="user-avatar"
                     onerror="this.onerror=null;this.src='./images/default-avatar.png';">
                <div class="user-info">
                    <strong>${user.name || 'N/A'}</strong>
                    <span>${user.unit || 'N/A'} / ${user.title || 'N/A'}</span>
                    <br>
                    <small style="color: #888;">狀態: ${user.status}</small>
                </div>
                <div class="user-actions" data-user-id="${user.userId}">
                    ${generateActionButtons(user.status)}
                </div>
            `;
            userListElem.appendChild(item);
        });
    }

    /**
     * 呼叫後端 API 載入使用者資料並渲染。
     * @param {string} filter 篩選條件
     * @param {string} searchTerm 搜尋關鍵字
     */
    async function loadUsers(filter, searchTerm = '') {
        const result = await callGasApi('getUsersByFilter', { filter, searchTerm });
        if (result.status === 'success') {
            renderUserList(result.data);
        } else {
            customAlert('載入使用者失敗: ' + result.message);
        }
    }

    // === 事件綁定 ===

    // 1. 使用者列表的操作按鈕 (使用事件委派)
    if (userListElem) {
        userListElem.addEventListener('click', async (e) => {
            const target = e.target;
            const actionContainer = target.closest('.user-actions');
            if (!actionContainer) return;

            const targetUserId = actionContainer.dataset.userId;
            let newStatus = '';
            let confirmMessage = '';

            if (target.classList.contains('approve-btn')) {
                newStatus = '通過';
                confirmMessage = '確定要通過此使用者的申請嗎？';
            } else if (target.classList.contains('reject-btn') || target.classList.contains('suspend-btn')) {
                newStatus = '停權';
                confirmMessage = '確定要拒絕/停權此使用者嗎？';
            } else if (target.classList.contains('edit-btn')) {
                customAlert('編輯功能尚未實作。');
                return;
            } else {
                return;
            }

            const isConfirmed = await customConfirm(confirmMessage);

            if (isConfirmed) {
                const result = await callGasApi('updateUserByAdmin', { targetUserId, newStatus });
                if (result.status === 'success') {
                    customAlert('狀態更新成功！');
                    loadUsers(currentFilter, searchInput.value); // 操作成功後重新載入列表
                } else {
                    customAlert('更新失敗: ' + result.message);
                }
            }
        });
    }

    // 2. 頂部篩選器按鈕
    if (filterButtons) {
        filterButtons.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                filterButtons.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = e.target.dataset.filter;
                if (searchInput) searchInput.value = '';
                loadUsers(currentFilter);
            }
        });
    }

    // 3. 搜尋功能
    if (searchBtn) {
        searchBtn.addEventListener('click', () => loadUsers(currentFilter, searchInput.value));
    }
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') loadUsers(currentFilter, searchInput.value);
        });
    }

    // 4. 模態視窗的按鈕
    if (confirmOkBtn) {
        confirmOkBtn.addEventListener('click', () => {
            if (confirmModal) confirmModal.style.display = 'none';
            if (resolveConfirm) resolveConfirm(true);
        });
    }
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', () => {
            if (confirmModal) confirmModal.style.display = 'none';
            if (resolveConfirm) resolveConfirm(false);
        });
    }
    if (alertOkBtn) {
        alertOkBtn.addEventListener('click', () => {
            if (alertModal) alertModal.style.display = 'none';
        });
    }

    // === 程式進入點 ===
    // 在所有設定都完成後，載入預設的「待審核」使用者列表
    loadUsers('pending');
}