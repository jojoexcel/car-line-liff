// js/status.js (獨立取消流程 - 完整最終版)

/**
 * status.html 頁面的主初始化函式。
 * 讓使用者查看自己的有效預約，並允許使用自訂模態視窗來取消。
 */
async function initializeStatusPage() {
    console.log("Initializing Status Page Logic...");

    // === DOM 元素快取 ===
    const reservationListElem = document.getElementById('reservation-list');
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');

    // 【關鍵】只獲取本頁面需要的模態視窗元素
    const cancelModal = document.getElementById('custom-confirm-modal'); // 在 status.html 中，這個就是取消視窗
    const cancelReasonInput = document.getElementById('cancel-reason-input');
    const confirmOkBtn = document.getElementById('confirm-ok-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

    // === 全域變數 ===
    let liffProfile = null;
    let reservationToCancel = {
        rowNum: null,
        buttonElement: null
    };

    /**
     * 渲染預約列表
     */
    function renderReservations(reservations) {
        if (!reservationListElem) return;
        reservationListElem.innerHTML = '';
        if (!reservations || reservations.length === 0) {
            if (infoText) infoText.textContent = '您目前沒有任何有效的預約。';
            if (infoPanel) infoPanel.style.display = 'block';
            return;
        }
        reservations.forEach(res => {
            const card = document.createElement('div');
            card.className = 'reservation-card';
            card.id = `reservation-${res.rowNum}`;
            let btnHtml = '';
            if (res.status === '預約成功') {
                btnHtml = `<button class="cancel-btn" data-row-num="${res.rowNum}">取消此預約</button>`;
            }
            card.innerHTML = `<h3>${res.carPlate} <span class="status-badge">${res.status}</span></h3><p><strong>時間：</strong>${res.startTime} - ${res.endTime}</p><p><strong>事由：</strong>${res.reason}</p>${btnHtml}`;
            reservationListElem.appendChild(card);
        });
    }

    /**
     * 【重寫】處理取消按鈕的點擊，只負責打開視窗
     */
    function handleCancelClick(e) {
        if (!e.target || !e.target.classList.contains('cancel-btn')) return;

        reservationToCancel.buttonElement = e.target;
        reservationToCancel.rowNum = e.target.dataset.rowNum;

        if (cancelReasonInput) cancelReasonInput.value = '';
        if (cancelModal) cancelModal.style.display = 'flex';
    }

    /**
     * 【新增】處理模態視窗中的「確定取消」按鈕點擊
     */
    async function confirmCancellation() {
        const { rowNum, buttonElement } = reservationToCancel;
        if (!rowNum || !buttonElement) return;

        // 從模態視窗中獲取原因
        const reason = cancelReasonInput ? cancelReasonInput.value : "";

        closeCancelModal(); // 關閉視窗

        buttonElement.disabled = true;
        buttonElement.textContent = '取消中...';

        const params = {
            rowNum: rowNum,
            reason: reason,
            operatorId: liffProfile.userId // 操作者就是使用者本人
        };

        const result = await callGasApi('cancelReservation', params);

        if (result.status === 'success') {
            showModalAlert('預約已成功取消！'); // 使用全域的 alert
            const cardToRemove = document.getElementById(`reservation-${rowNum}`);
            if (cardToRemove) {
                cardToRemove.style.transition = 'opacity 0.5s ease';
                cardToRemove.style.opacity = '0';
                setTimeout(() => cardToRemove.remove(), 500);
            }
        } else {
            showModalAlert(`取消失敗: ${result.message}`, '錯誤');
            buttonElement.disabled = false;
            buttonElement.textContent = '取消此預約';
        }
    }

    /**
     * 關閉模態視窗
     */
    function closeCancelModal() {
        if (cancelModal) cancelModal.style.display = 'none';
    }


    // === 初始化總流程 ===
    try {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;

        const result = await callGasApi('getMyReservations', { userId: liffProfile.userId });
        if (result.status === 'success') {
            renderReservations(result.data);
        } else {
            showModalAlert(result.message || '無法載入預約清單。', '錯誤');
        }

        // 綁定所有事件
        if (reservationListElem) reservationListElem.addEventListener('click', handleCancelClick);
        if (confirmOkBtn) confirmOkBtn.addEventListener('click', confirmCancellation);
        if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', closeCancelModal);

    } catch (e) {
        console.error("Status page init failed", e);
        showModalAlert("頁面初始化失敗", "錯誤");
    }
}