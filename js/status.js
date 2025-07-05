// js/status.js
document.addEventListener('DOMContentLoaded', async () => {
    let liffProfile = null;
    const reservationListElem = document.getElementById('reservation-list');
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');

    /**
     * 渲染預約列表
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
            card.id = `reservation-${res.rowNum}`; // 給卡片一個 ID
            card.innerHTML = `
                <h3>${res.carPlate}</h3>
                <p><strong>時間：</strong>${res.startTime} - ${res.endTime}</p>
                <p><strong>事由：</strong>${res.reason}</p>
                <p><strong>地點：</strong>${res.location}</p>
                <button class="cancel-btn" data-row-num="${res.rowNum}">取消此預約</button>
            `;
            reservationListElem.appendChild(card);
        });
    }

    /**
     * 處理取消按鈕的點擊事件
     * @param {Event} e 
     */
    async function handleCancelClick(e) {
        // 事件委派：檢查點擊的是否是取消按鈕
        if (!e.target.classList.contains('cancel-btn')) {
            return;
        }

        const button = e.target;
        const rowNum = button.dataset.rowNum;

        // 彈出輸入框，讓使用者填寫取消原因
        const cancelReason = prompt("請輸入取消原因（可留空）：", "");
        // 如果使用者點擊了 prompt 的「取消」按鈕，則 reason 為 null，中止操作
        if (cancelReason === null) {
            return; 
        }

        button.disabled = true;
        button.textContent = '取消中...';

        const params = {
            rowNum: rowNum,
            userId: liffProfile.userId,
            reason: cancelReason
        };

        const result = await callGasApi('cancelReservation', params);
        
        if (result.status === 'success') {
            // 取消成功後，直接從畫面上移除這張卡片
            const cardToRemove = document.getElementById(`reservation-${rowNum}`);
            if (cardToRemove) {
                cardToRemove.style.transition = 'opacity 0.5s';
                cardToRemove.style.opacity = '0';
                setTimeout(() => cardToRemove.remove(), 500);
            }
            alert('預約已成功取消！');
        } else {
            alert(`取消失敗: ${result.message}`);
            button.disabled = false;
            button.textContent = '取消此預約';
        }
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

    // 使用事件委派來監聽所有取消按鈕的點擊
    reservationListElem.addEventListener('click', handleCancelClick);

    // 執行初始化
    initializePage();
});
