// js/status.js (使用者專用取消版)

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
    const cancelReasonInput = document.getElementById('cancel-reason-input');

    // === 全域變數 ===
    let liffProfile = null;

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
                // data-user-id 在這裡雖然不是必須，但保留著也無妨
                btnHtml = `<button class="cancel-btn" data-row-num="${res.rowNum}" data-user-id="${liffProfile.userId}">取消此預約</button>`;
            }
            card.innerHTML = `<h3>${res.carPlate} <span class="status-badge">${res.status}</span></h3><p><strong>時間：</strong>${res.startTime} - ${res.endTime}</p><p><strong>事由：</strong>${res.reason}</p>${btnHtml}`;
            reservationListElem.appendChild(card);
        });
    }

    /**
     * 處理取消按鈕的點擊事件
     */
    async function handleCancelClick(e) {
        if (!e.target || !e.target.classList.contains('cancel-btn')) return;

        const button = e.target;
        const rowNum = button.dataset.rowNum;

        // 使用全域的 showModalConfirm 來獲取使用者確認和取消原因
        const isConfirmed = await showModalConfirm('您確定要取消這筆預約嗎？', '取消預約');

        if (isConfirmed) {
            const reason = cancelReasonInput ? cancelReasonInput.value : "";

            button.disabled = true;
            button.textContent = '取消中...';

            // 【關鍵修改】準備發送給後端的參數，只包含必要欄位
            const params = {
                rowNum: rowNum,
                reason: cancelReason,
                operatorId: liffProfile.userId // 【修改】操作者就是使用者本人
            };

            console.log("Sending params to cancelReservation:", params); // 除錯用

            const result = await callGasApi('cancelReservation', params);

            if (result.status === 'success') {
                showModalAlert('預約已成功取消！');
                const cardToRemove = document.getElementById(`reservation-${rowNum}`);
                if (cardToRemove) {
                    cardToRemove.style.transition = 'opacity 0.5s ease';
                    cardToRemove.style.opacity = '0';
                    setTimeout(() => cardToRemove.remove(), 500);
                }
            } else {
                showModalAlert(`取消失敗: ${result.message}`, '錯誤');
                button.disabled = false;
                button.textContent = '取消此預約';
            }
        }
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

        if (reservationListElem) {
            reservationListElem.addEventListener('click', handleCancelClick);
        }
    } catch (e) {
        console.error("Status page init failed", e);
        showModalAlert("頁面初始化失敗", "錯誤");
    }
}