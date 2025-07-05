// js/action.js (終極除錯版)
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

    function showMessage(text, type) {
        messageBox.textContent = text;
        messageBox.className = `message ${type}`;
        messageBox.style.display = 'block';
    }

    function updateUI(status, reservation) {
        // ... (這部分保持不變)
        pickupForm.style.display = 'none';
        returnForm.style.display = 'none';
        infoPanel.style.display = 'block';
        
        // 【關鍵】在這裡賦值
        currentReservation = reservation; 
        console.log('UI Updated. currentReservation is now:', currentReservation);

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
        // ... (這部分保持不變)
        liffProfile = await initializeLiff();
        if (!liffProfile) return;
        console.log('LIFF Profile initialized:', liffProfile);

        const result = await callGasApi('getPickupReturnStatus', { userId: liffProfile.userId });
        console.log('getPickupReturnStatus result:', result);
        
        if (result.status && result.status !== 'error') {
            updateUI(result.status, result.reservation);
        } else {
            showMessage(result.message || '檢查狀態失敗', 'error');
        }
    }

    // 【關鍵修改】處理表單提交的函式
    async function handleFormSubmit(e, actionType) {
        e.preventDefault();
        console.log(`--- handleFormSubmit started for action: ${actionType} ---`);

        try {
            // **步驟 1: 檢查核心變數**
            if (!liffProfile || !liffProfile.userId) {
                throw new Error('liffProfile or userId is missing!');
            }
            console.log('Check 1: liffProfile is OK.');

            if (!currentReservation || !currentReservation.recordId) {
                throw new Error('currentReservation or recordId is missing!');
            }
            console.log('Check 2: currentReservation is OK.');

            // **步驟 2: 取得表單數值**
            const mileageElem = document.getElementById(`${actionType.toLowerCase()}-mileage`);
            const notesElem = document.getElementById(`${actionType.toLowerCase()}-notes`);
            if (!mileageElem || !notesElem) {
                throw new Error('Could not find form elements (mileage or notes).');
            }
            console.log('Check 3: Form elements found.');

            const mileage = mileageElem.value;
            const notes = notesElem.value;
            
            // 檢查必填欄位
            if (!mileage) {
                alert('請務必輸入公里數！');
                return;
            }
            console.log(`Mileage: ${mileage}, Notes: ${notes}`);

            // **步驟 3: 組合參數**
            const params = {
                userId: liffProfile.userId,
                action: actionType,
                reservationId: currentReservation.recordId,
                carPlate: currentReservation.carPlate,
                mileage: mileage,
                notes: notes,
                gasFee: '' // 預設為空
            };

            if (actionType === '還車') {
                const gasFeeElem = document.getElementById('return-gas-fee');
                if (!gasFeeElem) throw new Error('Could not find gas fee element.');
                params.gasFee = gasFeeElem.value || '0';
                console.log(`Gas Fee: ${params.gasFee}`);
            }
            
            console.log('Params to be sent:', params);

            // **步驟 4: 呼叫 API**
            showMessage('正在儲存，請稍候...', 'info');
            const result = await callGasApi('processCarAction', params);
            console.log('processCarAction result:', result);

            // **步驟 5: 處理結果**
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
                throw new Error(result.message || '儲存失敗，未提供原因。');
            }

        } catch (error) {
            console.error('Error in handleFormSubmit:', error);
            showMessage(`前端錯誤: ${error.message}`, 'error');
        }
    }

    // 綁定表單提交事件
    pickupForm.addEventListener('submit', (e) => handleFormSubmit(e, '領車'));
    returnForm.addEventListener('submit', (e) => handleFormSubmit(e, '還車'));

    // 執行初始化
    initializePage();
});
