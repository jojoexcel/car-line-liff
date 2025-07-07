/**
 * 檔案說明：管理者專用的「未來借車管理」頁面 (reservation-management.html) 的主要邏輯。
 * 核心功能：顯示所有使用者的未來有效預約，並允許管理者強制取消任何一筆預約。
 * 版本：1.2 (確保程式碼完整性與正確性)
 */
async function initializeReservationManagementPage() {
    console.log("Initializing Reservation Management Page Logic...");

    // === DOM 元素快取 ===
    // 在程式開始時，一次性地獲取所有需要操作的 HTML 元素
    const authPanel = document.getElementById('auth-panel');
    const managementPanel = document.getElementById('management-panel');
    const reservationListElem = document.getElementById('reservation-list');

    // 模態視窗 (Modal) 相關的元素
    const cancelModalOverlay = document.getElementById('cancel-modal-overlay');
    const cancelReasonInput = document.getElementById('cancel-reason-input');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // === 全域變數 ===
    // 儲存當前登入的管理者 LIFF Profile (包含 userId, displayName)
    let liffProfile = null;
    // 儲存當前登入的管理者的系統 Profile (包含 name, status)
    let adminSystemProfile = null;
    // 儲存當前正要被取消的預約的相關資訊
    let reservationToCancel = {
        rowNum: null,          // 該預約在 Sheet 中的行號
        buttonElement: null,   // 被點擊的那個按鈕元素
        targetUserId: null     // 該預約申請人的 userId
    };

    /**
     * 渲染從後端獲取的預約列表。
     * @param {Array<object>} reservations - 包含多筆預約資料的陣列
     */
    function renderReservations(reservations) {
        if (!reservationListElem) return;
        reservationListElem.innerHTML = ''; // 清空舊列表，準備渲染新內容

        if (!reservations || reservations.length === 0) {
            reservationListElem.innerHTML = '<p style="text-align: center; color: #888;">目前沒有任何有效的預約。</p>';
            return;
        }

        reservations.forEach(res => {
            const card = document.createElement('div');
            card.className = 'reservation-card';
            card.id = `reservation-${res.rowNum}`;

            // 為每一筆預約都產生一個「強制取消」按鈕
            // 使用 data-* 屬性將必要資訊（行號、使用者ID）儲存在按鈕上
            const cancelButtonHtml = `<button class="cancel-btn" data-row-num="${res.rowNum}" data-user-id="${res.applicantId}">強制取消</button>`;

            card.innerHTML = `
                <h3>${res.carPlate} - <small>${res.applicantName}</small></h3>
                <p><strong>時間：</strong>${res.startTime} - ${res.endTime}</p>
                <p><strong>事由：</strong>${res.reason || '未填寫'}</p>
                <p><strong>狀態：</strong><span class="status-badge">${res.status}</span></p>
                ${cancelButtonHtml}
            `;
            reservationListElem.appendChild(card);
        });
    }

    /**
     * 處理「強制取消」按鈕的點擊事件。
     * 它的主要工作是：打開確認視窗，並記錄下是哪一筆預約要被取消。
     * @param {Event} e - 點擊事件物件
     */
    function handleCancelClick(e) {
        // 使用事件委派，只處理 class 包含 'cancel-btn' 的按鈕點擊
        if (!e.target || !e.target.classList.contains('cancel-btn')) {
            return;
        }

        // 從被點擊的按鈕的 data-* 屬性中，讀取要取消的預約資訊
        reservationToCancel.buttonElement = e.target;
        reservationToCancel.rowNum = e.target.dataset.rowNum;
        reservationToCancel.targetUserId = e.target.dataset.userId;

        // 清空模態視窗中的輸入框，並顯示它
        if (cancelReasonInput) cancelReasonInput.value = '';
        if (cancelModalOverlay) cancelModalOverlay.style.display = 'flex';
    }

    /**
     * 處理模態視窗中的「確認取消」按鈕點擊。
     * 這是真正執行取消操作的地方。
     */
    async function confirmCancellation() {
        const { rowNum, buttonElement, targetUserId } = reservationToCancel;
        if (!rowNum || !buttonElement || !targetUserId) {
            console.error("要取消的預約資訊不完整。");
            return;
        }

        const cancelReason = cancelReasonInput ? cancelReasonInput.value : "";

        // 先關閉模態視窗
        if (cancelModalOverlay) cancelModalOverlay.style.display = 'none';

        // 將按鈕狀態設為處理中，防止重複點擊
        buttonElement.disabled = true;
        buttonElement.textContent = '取消中...';

        // 準備要發送到後端的參數
        const params = {
            rowNum: rowNum,
            userId: targetUserId,             // 傳入的是「被取消者」的 ID
            adminId: liffProfile.userId,      // 傳入「管理者自己」的 ID，供後端驗證權限
            reason: `(由管理員 ${adminSystemProfile.name} 強制取消) ${cancelReason}`
        };

        // 呼叫後端 API
        const result = await callGasApi('cancelReservation', params);

        if (result.status === 'success') {
            alert('預約已成功取消！');
            // 從畫面上平滑地移除這張卡片，提供即時視覺回饋
            const cardToRemove = document.getElementById(`reservation-${rowNum}`);
            if (cardToRemove) {
                cardToRemove.style.transition = 'opacity 0.5s ease';
                cardToRemove.style.opacity = '0';
                setTimeout(() => cardToRemove.remove(), 500);
            }
        } else {
            // 如果操作失敗，顯示錯誤訊息並恢復按鈕狀態
            alert(`取消失敗: ${result.message}`);
            buttonElement.disabled = false;
            buttonElement.textContent = '強制取消';
        }
    }

    /**
     * 關閉取消模態視窗。
     */
    function closeCancelModal() {
        if (cancelModalOverlay) cancelModalOverlay.style.display = 'none';
    }

    /**
     * 從後端載入所有有效的預約並渲染到頁面。
     */
    async function loadAllReservations() {
        const result = await callGasApi('getAllActiveReservations');
        if (result.status === 'success') {
            renderReservations(result.data);
        } else {
            alert('載入預約列表失敗: ' + result.message);
            if (reservationListElem) reservationListElem.innerHTML = `<p style="color: red;">${result.message}</p>`;
        }
    }

    // === 頁面初始化總流程 ===
    try {
        // 1. 初始化 LIFF
        liffProfile = await initializeLiff();
        if (!liffProfile) {
            if(authPanel) authPanel.textContent = 'LIFF 初始化失敗或未登入。';
            return;
        }

        // 2. 驗證管理者權限
        const result = await callGasApi('getUserProfile', { userId: liffProfile.userId });
        if (result.status === 'found' && (result.data.status === '管理者' || result.data.status === '開發者')) {
            adminSystemProfile = result.data; // 儲存管理員的系統資料
            if(authPanel) authPanel.style.display = 'none';
            if(managementPanel) managementPanel.style.display = 'block';
        } else {
            if(authPanel) authPanel.textContent = '權限不足！此頁面僅供管理員使用。';
            return;
        }

        // 3. 綁定所有必要的事件監聽器
        if (reservationListElem) reservationListElem.addEventListener('click', handleCancelClick);
        if (modalConfirmBtn) modalConfirmBtn.addEventListener('click', confirmCancellation);
        if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeCancelModal);

        // 4. 載入初始的預約列表資料
        await loadAllReservations();

    } catch(e) {
        console.error("Reservation Management page initialization failed", e);
        if(authPanel) authPanel.textContent = '頁面初始化時發生嚴重錯誤。';
    }
}