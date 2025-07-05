// js/action.js (完整最終版)

document.addEventListener('DOMContentLoaded', async () => {
    // === 全域變數 ===
    let liffProfile = null; 
    let availableActions = []; 
    let currentAction = null;  

    // === DOM 元素快取 ===
    const selectionPanel = document.getElementById('selection-panel');
    const actionListElem = document.getElementById('action-list');
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

    function showActionForm(action) {
        try {
            console.log('Entering showActionForm with action:', action);
            currentAction = action; // 記錄當前操作的對象
            if (!currentAction) throw new Error("傳入的 action 為空！");

            selectionPanel.style.display = 'none'; // 隱藏選擇列表畫面

            if (action.mode === 'pickup') {
                console.log('Mode is pickup. Trying to show pickup form.');
                const carPlateElem = document.getElementById('pickup-car-plate');
                if (!carPlateElem) throw new Error("HTML 錯誤：找不到 ID 為 'pickup-car-plate' 的元素！");
                
                carPlateElem.value = action.reservation.carPlate;
                pickupForm.style.display = 'block';
                console.log('Pickup form displayed successfully.');

            } else if (action.mode === 'return') {
                console.log('Mode is return. Trying to show return form.');
                const carPlateElem = document.getElementById('return-car-plate');
                if (!carPlateElem) throw new Error("HTML 錯誤：找不到 ID 為 'return-car-plate' 的元素！");

                carPlateElem.value = action.reservation.carPlate;
                returnForm.style.display = 'block';
                console.log('Return form displayed successfully.');
            } else {
                throw new Error(`未知的 action mode: ${action.mode}`);
            }
        } catch (error) {
            console.error('CRITICAL ERROR in showActionForm:', error);
            showMessage(`前端 UI 錯誤: ${error.message}`, 'error');
        }
    }

    function renderActionList(actions) {
        infoPanel.style.display = 'none';
        selectionPanel.style.display = 'block';
        actionListElem.innerHTML = '';

        actions.forEach((action, index) => {
            const button = document.createElement('button');
            const actionText = action.mode === 'pickup' ? '領車' : '還車';
            button.className = action.mode;
            button.innerHTML = `<strong>${actionText}</strong>：${action.reservation.carPlate}`;
            button.dataset.actionIndex = index;

            button.addEventListener('click', () => {
                const selectedIndex = parseInt(button.dataset.actionIndex, 10);
                const selectedAction = availableActions[selectedIndex];
                if (selectedAction) {
                    showActionForm(selectedAction);
                } else {
                    console.error(`Could not find action at index ${selectedIndex}`);
                    showMessage('選擇錯誤，請刷新頁面重試。', 'error');
                }
            });
            actionListElem.appendChild(button);
        });
    }

    async function initializePage() {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;

        console.log('LIFF Initialized. UserID:', liffProfile.userId);
        const result = await callGasApi('getPickupReturnStatus', { userId: liffProfile.userId });
        console.log('API getPickupReturnStatus responded:', result);
        
        if (result.status === 'actions_available' && Array.isArray(result.actions) && result.actions.length > 0) {
            availableActions = result.actions;
            renderActionList(availableActions);
        } else if (result.status === 'no_action') {
            infoText.textContent = result.message;
        } else {
            showMessage(result.message || '檢查狀態失敗，請稍後再試。', 'error');
        }
    }
    
    function apiProcessCarAction(params) {
    try {
        // 【關鍵修正】接收的參數從 'action' 改為 'actionType'
        const { userId, actionType, reservationId, carPlate, mileage, notes, gasFee } = params;
        if (!userId || !actionType || !reservationId || !carPlate || !mileage) {
            return { status: 'error', message: '缺少必要參數' };
        }

        let actionKeyword;
        if (actionType === '領車') { // <-- 用 actionType 來判斷
            actionKeyword = 'PICKUP';
        } else if (actionType === '還車') {
            actionKeyword = 'RETURN';
        } else {
            throw new Error(`未知的操作類型: ${actionType}`);
        }

        const sheet = getSheet('車子領取記錄');
        const newRowData = [
            new Date(),
            userId,
            carPlate,
            actionKeyword,
            parseInt(mileage),
            reservationId,
            actionKeyword === 'RETURN' ? parseInt(gasFee || 0) : '',
            notes || ''
        ];

        sheet.appendRow(newRowData);

        return { status: 'success', message: `${actionType} 記錄已成功儲存！` }; // 回傳的訊息也用 actionType

    } catch (e) {
        Logger.log('apiProcessCarAction Error: ' + e);
        return { status: 'error', message: '寫入記錄時發生錯誤: ' + e.toString() };
    }
}
    
    pickupForm.addEventListener('submit', (e) => handleFormSubmit(e, 'pickup'));
    returnForm.addEventListener('submit', (e) => handleFormSubmit(e, 'return'));

    initializePage();
});
