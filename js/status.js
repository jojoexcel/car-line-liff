// js/status.js
document.addEventListener('DOMContentLoaded', async () => {
    let liffProfile = null;
    const reservationListElem = document.getElementById('reservation-list');
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');
  // 【新增】獲取模態視窗的元素
    const cancelModalOverlay = document.getElementById('cancel-modal-overlay');
    const cancelReasonInput = document.getElementById('cancel-reason-input');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
     // 用一個變數來儲存當前要取消的預約資訊
    let reservationToCancel = {
        rowNum: null,
        buttonElement: null
    };
     /**
     * 渲染預約列表 (狀態增強版)
     * @param {Array<object>} reservations 
     */
    function renderReservations(reservations) {
        reservationListElem.innerHTML = ''; // 清空舊列表

        if (reservations.length === 0) {
            infoText.textContent = '您目前沒有任何有效的預約。';
            infoPanel.style.display = 'block';
            return;
        }

        reservations.forEach(res => {
            const card = document.createElement('div');
            card.className = 'reservation-card';
            card.id = `reservation-${res.rowNum}`;

            // 【關鍵修改】根據狀態決定是否要產生取消按鈕
            let cancelButtonHtml = '';
            if (res.status === '預約成功') {
                cancelButtonHtml = `<button class="cancel-btn" data-row-num="${res.rowNum}">取消此預約</button>`;
            }

            card.innerHTML = `
                <h3>${res.carPlate} <span class="status-badge">${res.status}</span></h3>
                <p><strong>時間：</strong>${res.startTime} - ${res.endTime}</p>
                <p><strong>事由：</strong>${res.reason}</p>
                <p><strong>地點：</strong>${res.location}</p>
                ${cancelButtonHtml} 
            `;
            reservationListElem.appendChild(card);
        });
    }

      /**
     * 【重寫】處理取消按鈕的點擊事件，改為打開模態視窗
     */
    function handleCancelClick(e) {
        if (!e.target.classList.contains('cancel-btn')) {
            return;
        }
        
        // 儲存當前要操作的按鈕和行號
        reservationToCancel.buttonElement = e.target;
        reservationToCancel.rowNum = e.target.dataset.rowNum;

        // 清空輸入框並顯示模態視窗
        cancelReasonInput.value = '';
        cancelModalOverlay.style.display = 'flex';
    }

    /**
     * 【新增】處理模態視窗中的「確認取消」按鈕點擊
     */
    async function confirmCancellation() {
        const { rowNum, buttonElement } = reservationToCancel;
        if (!rowNum || !buttonElement) return;

        const cancelReason = cancelReasonInput.value;

        // 關閉模態視窗
        cancelModalOverlay.style.display = 'none';

        buttonElement.disabled = true;
        buttonElement.textContent = '取消中...';

        const params = {
            rowNum: rowNum,
            userId: liffProfile.userId,
            reason: cancelReason
        };

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
    
    /**
     * 【新增】處理模態視窗中的「暫不取消」按鈕點擊
     */
    function closeCancelModal() {
        cancelModalOverlay.style.display = 'none';
    }

    /**
     * 初始化頁面
     */
    async function initializePage() {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;

        const result = await callGasApi('getMyReservations', { userId: liffProfile.userId });

        if (result.status === 'success') {
            renderReservations(result.data);
        } else {
            infoText.textContent = result.message || '無法載入預約清單。';
            infoPanel.style.display = 'block';
        }
    }

  // === 事件綁定 ===
    reservationListElem.addEventListener('click', handleCancelClick);
    modalConfirmBtn.addEventListener('click', confirmCancellation);
    modalCancelBtn.addEventListener('click', closeCancelModal);

    // 執行初始化
    initializePage();
});
