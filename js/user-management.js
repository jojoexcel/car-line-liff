/**
 * 檔案說明：管理者專用的「使用者管理」頁面 (user-management.html) 的主要邏輯。
 * 核心功能：篩選、搜尋、審核、編輯，以及基於操作者權限的管理員升降級。
 * 版本：4.0 (權限判斷 UI 版)
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

    // 確認對話框元素
    const confirmModal = document.getElementById('custom-confirm-modal');
    const confirmText = document.getElementById('confirm-text');
    const confirmOkBtn = document.getElementById('confirm-ok-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

    // 訊息提示框元素
    const alertModal = document.getElementById('custom-alert-modal');
    const alertText = document.getElementById('alert-text');
    const alertOkBtn = document.getElementById('alert-ok-btn');

    // 編輯表單模態視窗元素
    const editModal = document.getElementById('edit-user-modal');
    const editForm = document.getElementById('edit-user-form');
    const editCancelBtn = document.getElementById('edit-cancel-btn');
    const editUserIdInput = document.getElementById('edit-userId');
    const editNameInput = document.getElementById('edit-name');
    const editPhoneInput = document.getElementById('edit-phone');
    const editUnitInput = document.getElementById('edit-unit');
    const editTitleInput = document.getElementById('edit-title');

    // === 全域狀態變數 ===
    let currentFilter = 'pending';
    let liffProfile = null;
    let adminSystemProfile = null; // 儲存登入管理員的完整 Profile
    let recentUsers = [];
    let resolveConfirm;

    // === 權限驗證 ===
    try {
        liffProfile = await initializeLiff();
        if (!liffProfile) {
            authPanel.textContent = 'LIFF 初始化失敗或未登入。';
            return;
        }
        const result = await callGasApi('getUserProfile', { userId: liffProfile.userId });
        if (result.status === 'found' && (result.data.status === '管理者' || result.data.status === '開發者')) {
            adminSystemProfile = result.data; // 儲存管理員資料
            authPanel.style.display = 'none';
            managementPanel.style.display = 'block';
        } else {
            authPanel.textContent = '權限不足！此頁面僅供管理員使用。';
            return;
        }
    } catch (error) {
        authPanel.textContent = '權限驗證過程中發生錯誤。';
        console.error("Auth check failed:", error);
        return;
    }

    // === 輔助函式 ===

    function customAlert(message) {
        if (alertText) alertText.textContent = message;
        if (alertModal) alertModal.style.display = 'flex';
    }

    function customConfirm(message) {
        return new Promise((resolve) => {
            resolveConfirm = resolve;
            if (confirmText) confirmText.textContent = message;
            if (confirmModal) confirmModal.style.display = 'flex';
        });
    }

    /**
     * 根據使用者狀態 和 操作者身份，產生對應的操作按鈕
     * @param {object} user - 被操作的使用者物件
     * @returns {string} HTML 按鈕字串
     */
    function generateActionButtons(user) {
        const status = user.status;
        const isDeveloperSelf = (adminSystemProfile.status === '開發者');

        // 不能對自己或開發者進行狀態操作
        if (user.userId === adminSystemProfile.userId) return '<span style="color: #888;">(這是您自己)</span>';
        if (status === '開發者') return '<span style="color: #888;">(系統保留帳號)</span>';

        let buttons = '';

        if (status === '待審核') {
            buttons = `<button class="approve-btn">✅ 通過</button><button class="reject-btn">❌ 拒絕</button>`;
        } else if (status === '通過') {
            buttons = `<button class="edit-btn">✏️ 編輯</button><button class="suspend-btn">🚫 停權</button>`;
            if (isDeveloperSelf) {
                buttons += `<button class="promote-btn">⬆️ 提升為管理者</button>`;
            }
        } else if (status === '管理者') {
            buttons = `<button class="edit-btn">✏️ 編輯</button>`;
            if (isDeveloperSelf) {
                buttons += `<button class="demote-btn">⬇️ 降級為使用者</button>`;
                buttons += `<button class="suspend-btn">🚫 停權</button>`;
            }
        } else if (status === '停權') {
            buttons = `<button class="edit-btn">✏️ 編輯</button><button class="approve-btn">✅ 復權</button>`;
        }
        
        return buttons;
    }

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
            const avatarUrl = user.linePicUrl || './images/default-avatar.png';
            item.innerHTML = `
                <img src="${avatarUrl}" alt="avatar" class="user-avatar" onerror="this.onerror=null;this.src='./images/default-avatar.png';">
                <div class="user-info">
                    <strong>${user.name || 'N/A'}</strong>
                    <span>${user.unit || 'N/A'} / ${user.title || 'N/A'}</span><br>
                    <small style="color: #888;">狀態: ${user.status}</small>
                </div>
                <div class="user-actions" data-user-id="${user.userId}">${generateActionButtons(user)}</div>
            `;
            userListElem.appendChild(item);
        });
    }

    async function loadUsers(filter, searchTerm = '') {
        const result = await callGasApi('getUsersByFilter', { filter, searchTerm });
        if (result.status === 'success') {
            recentUsers = result.data;
            renderUserList(recentUsers);
        } else {
           customAlert('載入使用者失敗: ' + result.message);
        }
    }

    function openEditModal(userId) {
        const userToEdit = recentUsers.find(u => u.userId === userId);
        if (!userToEdit) { customAlert("找不到該使用者的詳細資料。"); return; }
        editUserIdInput.value = userToEdit.userId;
        editNameInput.value = userToEdit.name;
        editPhoneInput.value = userToEdit.phone;
        editUnitInput.value = userToEdit.unit;
        editTitleInput.value = userToEdit.title;
        editModal.style.display = 'flex';
    }

    function closeEditModal() {
        if (editModal) editModal.style.display = 'none';
    }

    async function handleEditFormSubmit(e) {
        e.preventDefault();
        const phoneRegex = /^09\d{2}-\d{6}$/;
        if (!phoneRegex.test(editPhoneInput.value)) {
           customAlert("電話格式不正確，應為 09xx-xxxxxx。");
            return;
        }
        const params = { 
            operatorId: liffProfile.userId, // 加上操作者 ID
            targetUserId: editUserIdInput.value, 
            name: editNameInput.value, 
            phone: editPhoneInput.value, 
            unit: editUnitInput.value, 
            title: editTitleInput.value 
        };
        const result = await callGasApi('updateUserByAdmin', params);
        if (result.status === 'success') {
           customAlert('使用者資料已成功更新！');
            closeEditModal();
            loadUsers(currentFilter, searchInput.value);
        } else {
           customAlert('更新失敗: ' + result.message);
        }
    }

    // === 事件綁定 ===

    if (userListElem) {
        userListElem.addEventListener('click', async (e) => {
            const target = e.target;
            const actionContainer = target.closest('.user-actions');
            if (!actionContainer) return;
            const targetUserId = actionContainer.dataset.userId;

            if (target.classList.contains('edit-btn')) {
                openEditModal(targetUserId);
                return;
            }

            let newStatus = '', confirmMessage = '';
            if (target.classList.contains('approve-btn')) { newStatus = '通過'; confirmMessage = '確定要通過/復權此使用者嗎？';
            } else if (target.classList.contains('reject-btn') || target.classList.contains('suspend-btn')) { newStatus = '停權'; confirmMessage = '確定要拒絕/停權此使用者嗎？';
            } else if (target.classList.contains('promote-btn')) { newStatus = '管理者'; confirmMessage = '確定要將此使用者提升為「管理者」嗎？\n此操作只有開發者能執行。';
            } else if (target.classList.contains('demote-btn')) { newStatus = '通過'; confirmMessage = '確定要將此管理者降級為「一般使用者」嗎？\n此操作只有開發者能執行。';
            } else { return; }

            const isConfirmed = await customConfirm(confirmMessage);
            if (isConfirmed) {
                const params = { 
                    operatorId: liffProfile.userId, 
                    targetUserId: targetUserId, 
                    newStatus: newStatus 
                };
                const result = await callGasApi('updateUserByAdmin', params);
                if (result.status === 'success') {
                   customAlert('狀態更新成功！');
                    loadUsers(currentFilter, searchInput.value);
                } else {
                   customAlert('更新失敗: ' + result.message);
                }
            }
        });
    }

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
    
    if (searchBtn) searchBtn.addEventListener('click', () => loadUsers(currentFilter, searchInput.value));
    if (searchInput) searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') loadUsers(currentFilter, searchInput.value); });
    
    if (confirmOkBtn) confirmOkBtn.addEventListener('click', () => { if (confirmModal) confirmModal.style.display = 'none'; if (resolveConfirm) resolveConfirm(true); });
    if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', () => { if (confirmModal) confirmModal.style.display = 'none'; if (resolveConfirm) resolveConfirm(false); });
    if (alertOkBtn) alertOkBtn.addEventListener('click', () => { if (alertModal) alertModal.style.display = 'none'; });

    if (editForm) editForm.addEventListener('submit', handleEditFormSubmit);
    if (editCancelBtn) editCancelBtn.addEventListener('click', closeEditModal);

    // === 程式進入點 ===
    loadUsers('pending');
}
