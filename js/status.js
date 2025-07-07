// js/status.js (全域對話框版)

/**
 * status.html 頁面的主初始化函式。
 * 讓使用者查看自己的有效預約，並允許取消。
 */
async function initializeStatusPage() {
    console.log("Initializing Status Page Logic...");

    // === DOM 元素快取 ===
    const reservationListElem = document.getElementById('reservation-list');
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');
    // 【注意】我們不再需要直接操作模態視窗的按鈕，因為 main.js 會處理
    const cancelReasonInput = document.getElementById('cancel-reason-input');

    // === 全域變數 ===
    let liffProfile = null;

    /**
     * 渲染預約列表 (這個函式保持不變)
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
                // 【關鍵】data-user-id 儲存的是預約者本人(自己)的 ID
                btnHtml = `<button class="cancel-btn" data-row-num="${res.rowNum}" data-user-id="${liffProfile.userId}">取消此預約</button>`;
            }
            card.innerHTML = `<h3>${res.carPlate} <span class="status-badge">${res.status}</span></h3><p><strong>時間：</strong>${res.startTime} - ${res.endTime}</p><p><strong>事由：</strong>${res.reason}</p>${btnHtml}`;
            reservationListElem.appendChild(card);
        });
    }

    /**
     * 【重構】處理取消按鈕的點擊事件
     */
    async function handleCancelClick(e) {
        if (!e.target || !e.target.classList.contains('cancel-btn')) return;

        const button = e.target;
        const rowNum = button.dataset.rowNum;
        const userId = button.dataset.userId;

        // 【關鍵修改】使用全域的 showModalConfirm，它會處理模態視窗的顯示和使用者互動
        // 我們用一個自訂的標題來打開它
        const isConfirmed = await showModalConfirm('您確定要取消這筆預約嗎？', '取消預約');

        if (isConfirmed) {
            // 只有在使用者點擊「確定」後，才繼續執行
            const reason = cancelReasonInput ? cancelReasonInput.value : "";

            button.disabled = true;
            button.textContent = '取消中...';

            // 準備參數，這裡不需要 adminId
            const params = { rowNum, userId, reason };
            const result = await callGasApi('cancelReservation', params);

            if (result.status === 'success') {
                showModalAlert('預約已成功取消！');
                const cardToRemove = document.getElementById(`reservation-${rowNum}`);
                if (cardToRemove) {
                    cardToRemove.style.transition = 'opacity 0.5s';
                    cardToRemove.style.opacity = '0';
                    setTimeout(() => cardToRemove.remove(), 500);
                }
            } else {
                showModalAlert(`取消失敗: ${result.message}`, '錯誤');
                button.disabled = false;
                button.textContent = '取消此預約';
            }
        }
        // 如果使用者點擊「暫不取消」，isConfirmed 為 false，函式直接結束，什麼都不做。
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

        // 事件綁定：只需要監聽整個列表的點擊即可
        if (reservationListElem) {
            reservationListElem.addEventListener('click', handleCancelClick);
        }
    } catch (e) {
        console.error("Status page init failed", e);
        showModalAlert("頁面初始化失敗", "錯誤");
    }
}