// js/status.js (模組化版)

/**
 * status.html 頁面的主初始化函式。
 */
async function initializeStatusPage() {
    console.log("Initializing Status Page Logic...");

    let liffProfile = null;
    const reservationListElem = document.getElementById('reservation-list');
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');
    const cancelModalOverlay = document.getElementById('cancel-modal-overlay');
    const cancelReasonInput = document.getElementById('cancel-reason-input');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    let reservationToCancel = {
        rowNum: null,
        buttonElement: null
    };

    function renderReservations(reservations) {
        if (!reservationListElem) return;
        reservationListElem.innerHTML = '';
        if (reservations.length === 0) {
            if (infoText) infoText.textContent = '您目前沒有任何有效的預約。';
            if (infoPanel) infoPanel.style.display = 'block';
            return;
        }
        reservations.forEach(res => {
            const card = document.createElement('div');
            card.className = 'reservation-card';
            card.id = `reservation-${res.rowNum}`;
            let cancelButtonHtml = '';
            if (res.status === '預約成功') {
                cancelButtonHtml = `<button class="cancel-btn" data-row-num="${res.rowNum}">取消此預約</button>`;
            }
            card.innerHTML = `<h3>${res.carPlate} <span class="status-badge">${res.status}</span></h3><p><strong>時間：</strong>${res.startTime} - ${res.endTime}</p><p><strong>事由：</strong>${res.reason}</p><p><strong>地點：</strong>${res.location}</p>${cancelButtonHtml}`;
            reservationListElem.appendChild(card);
        });
    }

    function handleCancelClick(e) {
        if (!e.target || !e.target.classList.contains('cancel-btn')) return;
        reservationToCancel.buttonElement = e.target;
        reservationToCancel.rowNum = e.target.dataset.rowNum;
        if (cancelReasonInput) cancelReasonInput.value = '';
        if (cancelModalOverlay) cancelModalOverlay.style.display = 'flex';
    }

    async function confirmCancellation() {
        const { rowNum, buttonElement } = reservationToCancel;
        if (!rowNum || !buttonElement) return;
        const cancelReason = cancelReasonInput ? cancelReasonInput.value : "";
        if (cancelModalOverlay) cancelModalOverlay.style.display = 'none';
        buttonElement.disabled = true;
        buttonElement.textContent = '取消中...';
        const params = { rowNum, userId: liffProfile.userId, reason: cancelReason };
        const result = await callGasApi('cancelReservation', params);
        if (result.status === 'success') {
            const cardToRemove = document.getElementById(`reservation-${rowNum}`);
            if (cardToRemove) {
                cardToRemove.style.transition = 'opacity 0.5s';
                cardToRemove.style.opacity = '0';
                setTimeout(() => cardToRemove.remove(), 500);
            }
            alert('預約已成功取消！');
        } else {
            alert(`取消失敗: ${result.message}`);
            buttonElement.disabled = false;
            buttonElement.textContent = '取消此預約';
        }
    }

    function closeCancelModal() {
        if (cancelModalOverlay) cancelModalOverlay.style.display = 'none';
    }

    try {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;
        const result = await callGasApi('getMyReservations', { userId: liffProfile.userId });
        if (result.status === 'success') {
            renderReservations(result.data);
        } else {
            if (infoText) infoText.textContent = result.message || '無法載入預約清單。';
            if (infoPanel) infoPanel.style.display = 'block';
        }
        if (reservationListElem) reservationListElem.addEventListener('click', handleCancelClick);
        if (modalConfirmBtn) modalConfirmBtn.addEventListener('click', confirmCancellation);
        if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeCancelModal);
    } catch (e) {
        console.error("Status page initialization failed", e);
    }
}