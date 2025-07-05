// js/action.js
document.addEventListener('DOMContentLoaded', async () => {
    // 全域變數
    let liffProfile = null;
    let currentReservation = null;

    // 取得 HTML 元素
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');
    const pickupForm = document.getElementById('pickup-form');
    const returnForm = document.getElementById('return-form');
    const messageBox = document.getElementById('message-box');

    // 顯示訊息
    function showMessage(text, type) {
        messageBox.textContent = text;
        messageBox.className = `message ${type}`;
        messageBox.style.display = 'block';
    }

    // 根據後端回傳的狀態，更新 UI
    function updateUI(status, reservation) {
        pickupForm.style.display = 'none';
        returnForm.style.display = 'none';
        infoPanel.style.display = 'block';
        currentReservation = reservation; // 儲存預約資訊

        switch (status) {
            case 'ready_for_pickup':
                infoPanel.style.display = 'none';
                pickupForm.style.display = 'block';
                document.getElementById('pickup-car-plate').value = reservation.carPlate;
                break;
            case 'ready_for_return':
                infoPanel.style.display = 'none';
                returnForm.style.display = 'block';
                document.getElementById('return-car-plate').value = reservation.carPlate;
                break;
            case 'no_action':
                infoText.textContent = '您目前沒有可執行的領/還車預約。';
                break;
            default:
                infoText.textContent = '無法判斷您的狀態，請聯繫管理員。';
        }
    }

    // 主初始化流程
    async function initializePage() {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;

        const result = await callGasApi('getPickupReturnStatus', { userId: liffProfile.userId });
        
        if (result.status && result.status !== 'error') {
            updateUI(result.status, result.reservation);
        } else {
            showMessage(result.message || '檢查狀態失敗', 'error');
        }
    }

    // 處理表單提交
    async function handleFormSubmit(e, actionType) {
        e.preventDefault();
        
        const params = {
            userId: liffProfile.userId,
            action: actionType,
            reservationId: currentReservation.recordId,
            carPlate: currentReservation.carPlate,
            mileage: document.getElementById(`${actionType.toLowerCase()}-mileage`).value,
            notes: document.getElementById(`${actionType.toLowerCase()}-notes`).value,
            gasFee: actionType === '還車' ? document.getElementById('return-gas-fee').value : ''
        };
        
        const result = await callGasApi('processCarAction', params);

        if (result.status === 'success') {
            showMessage(result.message, 'success');
            pickupForm.style.display = 'none';
            returnForm.style.display = 'none';
            infoPanel.style.display = 'block';
            infoText.textContent = '操作完成！您可以關閉此頁面。';
            setTimeout(() => {
                if (liff.isInClient()) {
                    liff.closeWindow();
                }
            }, 3000);
        } else {
            showMessage(result.message || '操作失敗', 'error');
        }
    }

    // 綁定表單提交事件
    pickupForm.addEventListener('submit', (e) => handleFormSubmit(e, '領車'));
    returnForm.addEventListener('submit', (e) => handleFormSubmit(e, '還車'));

    // 執行初始化
    initializePage();
});
