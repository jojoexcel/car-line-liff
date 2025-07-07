// js/user-management.js
async function initializeUserManagementPage() {
    const authPanel = document.getElementById('auth-panel');
    const managementPanel = document.getElementById('management-panel');
    const userListElem = document.getElementById('user-list');
    const filterButtons = document.getElementById('filter-buttons');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    let currentFilter = 'pending'; // 預設顯示待審核

    // 權限驗證
    const liffProfile = await initializeLiff();
    if (!liffProfile) { authPanel.textContent = 'LIFF 初始化失敗'; return; }
    const adminProfile = await callGasApi('getUserProfile', { userId: liffProfile.userId });
    if (adminProfile.status !== 'found' || (adminProfile.data.status !== '管理者' && adminProfile.data.status !== '開發者')) {
        authPanel.textContent = '權限不足！';
        return;
    }
    authPanel.style.display = 'none';
    managementPanel.style.display = 'block';

    // 渲染使用者列表的函式
    function renderUserList(users) {
        userListElem.innerHTML = '';
        if (users.length === 0) {
            userListElem.innerHTML = '<p style="text-align: center; color: #888;">此分類下沒有使用者。</p>';
            return;
        }
        users.forEach(user => {
            const item = document.createElement('div');
            item.className = 'user-list-item';
            item.innerHTML = `
                <img src="${user.linePicUrl || 'https://via.placeholder.com/50'}" alt="avatar" class="user-avatar">
                <div class="user-info">
                    <strong>${user.name}</strong>
                    <span>${user.unit} / ${user.title}</span>
                </div>
                <div class="user-actions" data-user-id="${user.userId}">
                    ${generateActionButtons(user.status)}
                </div>
            `;
            userListElem.appendChild(item);
        });
    }

    // 根據使用者狀態產生對應的操作按鈕
    function generateActionButtons(status) {
        if (status === '待審核') {
            return `<button class="approve-btn">✅ 通過</button><button class="reject-btn">❌ 拒絕</button>`;
        }
        if (status === '通過' || status === '管理者' || status === '開發者') {
            return `<button class="edit-btn">✏️ 編輯</button><button class="suspend-btn">🚫 停權</button>`;
        }
        if (status === '停權') {
            return `<button class="edit-btn">✏️ 編輯</button><button class="approve-btn">✅ 復權</button>`;
        }
        return '';
    }

    // 載入使用者資料
    async function loadUsers(filter, searchTerm = '') {
        const result = await callGasApi('getUsersByFilter', { filter, searchTerm });
        if (result.status === 'success') {
            renderUserList(result.data);
        } else {
            alert('載入使用者失敗: ' + result.message);
        }
    }

    // 處理所有操作按鈕的點擊事件 (事件委派)
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
            // TODO: 編輯功能，可以彈出一個模態視窗來修改資料
            alert('編輯功能尚未實作。');
            return;
        } else {
            return;
        }

        if (confirm(confirmMessage)) {
            const result = await callGasApi('updateUserByAdmin', { targetUserId, newStatus });
            if (result.status === 'success') {
                alert('狀態更新成功！');
                loadUsers(currentFilter, searchInput.value); // 重新載入列表
            } else {
                alert('更新失敗: ' + result.message);
            }
        }
    });

    // 篩選器按鈕事件
    filterButtons.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            filterButtons.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            searchInput.value = ''; // 切換篩選時清空搜尋
            loadUsers(currentFilter);
        }
    });

    // 搜尋按鈕事件
    searchBtn.addEventListener('click', () => loadUsers(currentFilter, searchInput.value));
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') loadUsers(currentFilter, searchInput.value);
    });

    // 頁面初始化時，載入預設列表
    loadUsers('pending');
}