/**
 * 檔案說明：管理者專用的「未來借車管理」頁面 (reservation-management.html) 的主要邏輯。
 * 核心功能：顯示所有使用者的未來有效預約，並允許管理者強制取消任何一筆預約。
 * 版本：1.3 (修正取消流程，全面採用自訂對話框)
 */
async function initializeReservationManagementPage() {
    console.log("Initializing Reservation Management Page Logic...");

    // === DOM 元素快取 ===
    const authPanel = document.getElementById('auth-panel');
    const managementPanel = document.getElementById('management-panel');
    const reservationListElem = document.getElementById('reservation-list');

    // 模態視窗 (Modal) 相關的元素
    const cancelModalOverlay = document.getElementById('custom-confirm-modal'); // 使用 confirm modal
    const cancelReasonInput = document.getElementById('cancel-reason-input');
    const modalConfirmBtn = document.getElementById('confirm-ok-btn');
    const modalCancelBtn = document.getElementById('confirm-cancel-btn');

    // === 全域變數 ===
    let liffProfile = null;
    let adminSystemProfile = null;
    let reservationToCancel = { rowNum: null, buttonElement: null, targetUserId: null };

    // === 權限驗證 (在所有操作之前執行) ===
    try {
        liffProfile = await initializeLiff();
        if (!liffProfile) {
            if(authPanel) authPanel.textContent = 'LIFF 初始化失敗或未登入。';
            return;
        }
        const result = await callGasApi('getUserProfile', { userId: liffProfile.userId });
        if (result.status === 'found' && (result.data.status === '管理者' || result.data.status === '開發者')) {
            adminSystemProfile = result.data;
            if(authPanel) authPanel.style.display = 'none';
            if(managementPanel) managementPanel.style.display = 'block';
        } else {
            if(authPanel) authPanel.textContent = '權限不足！此頁面僅供管理員使用。';
            return;
        }
    } catch(e) {
        console.error("Page initialization failed during auth check:", e);
        if(authPanel) authPanel.textContent = '頁面初始化時發生嚴重錯誤。';
        return; // 驗證失敗，不繼續執行後續程式碼
    }

    // === 輔助函式 ===

    function renderReservations(reservations) {
        if (!reservationListElem) return;
        reservationListElem.innerHTML = '';
        if (!reservations || reservations.length === 0) {
            reservationListElem.innerHTML = '<p style="text-align: center; color: #888;">目前沒有任何有效的預約。</p>';
            return;
        }
        reservations.forEach(res => {
            const card = document.createElement('div');
            card.className = 'reservation-card';
            card.id = `reservation-${res.rowNum}`;
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

    // === 事件處理函式 ===

    function handleCancelClick(e) {
        if (!e.target || !e.target.classList.contains('cancel-btn')) return;

        reservationToCancel.buttonElement = e.target;
        reservationToCancel.rowNum = e.target.dataset.rowNum;
        reservationToCancel.targetUserId = e.target.dataset.userId;

        if (cancelReasonInput) cancelReasonInput.value = '';
        if (cancelModalOverlay) cancelModalOverlay.style.display = 'flex';
    }

    async function confirmCancellation() {
        const { rowNum, buttonElement, targetUserId } = reservationToCancel;
        if (!rowNum || !buttonElement || !targetUserId) return;

        const cancelReason = cancelReasonInput ? cancelReasonInput.value : "";
        if (cancelModalOverlay) cancelModalOverlay.style.display = 'none';

        buttonElement.disabled = true;
        buttonElement.textContent = '取消中...';

        const params = {
            rowNum: rowNum,
            userId: targetUserId,
            adminId: liffProfile.userId,
            reason: `(由管理員 ${adminSystemProfile.name} 強制取消) ${cancelReason}`
        };

        const result = await callGasApi('cancelReservation', params);

        if (result.status === 'success') {
            // 【修正】使用我們在 main.js 中定義的全域 custom alert
            showModalAlert('預約已成功取消！');
            const cardToRemove = document.getElementById(`reservation-${rowNum}`);
            if (cardToRemove) {
                cardToRemove.style.transition = 'opacity 0.5s ease';
                cardToRemove.style.opacity = '0';
                setTimeout(() => cardToRemove.remove(), 500);
            }
        } else {
            // 【修正】使用我們在 main.js 中定義的全域 custom alert
            showModalAlert(`取消失敗: ${result.message}`, '錯誤');
            buttonElement.disabled = false;
            buttonElement.textContent = '強制取消';
        }
    }

    function closeCancelModal() {
        if (cancelModalOverlay) cancelModalOverlay.style.display = 'none';
    }

    async function loadAllReservations() {
        const result = await callGasApi('getAllActiveReservations');
        if (result.status === 'success') {
            renderReservations(result.data);
        } else {
            // 【修正】使用我們在 main.js 中定義的全域 custom alert
            showModalAlert('載入預約列表失敗: ' + result.message, '錯誤');
            if (reservationListElem) reservationListElem.innerHTML = `<p style="color: red;">${result.message}</p>`;
        }
    }

    // === 事件綁定 ===
    if (reservationListElem) reservationListElem.addEventListener('click', handleCancelClick);
    if (modalConfirmBtn) modalConfirmBtn.addEventListener('click', confirmCancellation);
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeCancelModal);

    // === 程式進入點 ===
    // 只有在權限驗證成功後，才載入資料
    loadAllReservations();
}