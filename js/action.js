document.addEventListener('DOMContentLoaded', async () => {
    let liffProfile = null;
    let currentReservation = null;

    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');
    const pickupForm = document.getElementById('pickup-form');
    const returnForm = document.getElementById('return-form');
    const messageBox = document.getElementById('message-box');

    function showMessage(text, type) {
        messageBox.textContent = text;
        messageBox.className = `message ${type}`;
        messageBox.style.display = 'block';
    }

    function updateUI(status, reservation) {
        pickupForm.style.display = 'none';
        returnForm.style.display = 'none';
        infoPanel.style.display = 'block';
        currentReservation = reservation;

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

    // 【關鍵修正】actionType 統一使用英文 'pickup' 或 'return'
    async function handleFormSubmit(e, actionType) {
        e.preventDefault();
        
        try {
            if (!liffProfile || !currentReservation) {
                throw new Error('核心資料遺失，無法提交。');
            }

            // 使用英文關鍵字來尋找元素
            const mileageElem = document.getElementById(`${actionType}-mileage`);
            const notesElem = document.getElementById(`${actionType}-notes`);
            
            if (!mileageElem) {
                throw new Error(`找不到 ID 為 ${actionType}-mileage 的元素。`);
            }

            const mileage = mileageElem.value;
            const notes = notesElem ? notesElem.value : '';
            
            if (!mileage) {
                alert('請務必輸入公里數！');
                return;
            }

            const params = {
                userId: liffProfile.userId,
                // 後端 API 接收的 action 依然是中文，因為後端邏輯是用中文寫的
                action: actionType === 'pickup' ? '領車' : '還車', 
                reservationId: currentReservation.recordId,
                carPlate: currentReservation.carPlate,
                mileage: mileage,
                notes: notes,
                gasFee: ''
            };

            if (actionType === 'return') {
                const gasFeeElem = document.getElementById('return-gas-fee');
                params.gasFee = gasFeeElem ? gasFeeElem.value || '0' : '0';
            }
            
            showMessage('正在儲存，請稍候...', 'info');
            const result = await callGasApi('processCarAction', params);

            if (result.status === 'success') {
                showMessage(result.message, 'success');
                e.target.style.display = 'none'; // 隱藏當前提交的表單
                infoPanel.style.display = 'block';
                infoText.textContent = '操作完成！您可以關閉此頁面。';
                setTimeout(() => liff.isInClient() && liff.closeWindow(), 3000);
            } else {
                throw new Error(result.message || '儲存失敗，未提供原因。');
            }

        } catch (error) {
            console.error('Error in handleFormSubmit:', error);
            showMessage(`前端錯誤: ${error.message}`, 'error');
        }
    }

    // 【關鍵修正】綁定事件時，傳入固定的英文關鍵字
    pickupForm.addEventListener('submit', (e) => handleFormSubmit(e, 'pickup'));
    returnForm.addEventListener('submit', (e) => handleFormSubmit(e, 'return'));

    initializePage();
});
