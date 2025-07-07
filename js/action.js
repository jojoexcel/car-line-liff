// js/action.js (模組化版)

/**
 * action.html 頁面的主初始化函式。
 */
async function initializeActionPage() {
    console.log("Initializing Action Page Logic...");

    let liffProfile = null;
    let availableActions = [];
    let currentAction = null;

    const selectionPanel = document.getElementById('selection-panel');
    const actionListElem = document.getElementById('action-list');
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');
    const pickupForm = document.getElementById('pickup-form');
    const returnForm = document.getElementById('return-form');
    const messageBox = document.getElementById('message-box');

    function showMessage(text, type) { /* ... */ }

    function showActionForm(action) {
        try {
            currentAction = action;
            if (selectionPanel) selectionPanel.style.display = 'none';
            if (action.mode === 'pickup') {
                const carPlateElem = document.getElementById('pickup-car-plate');
                if (carPlateElem) carPlateElem.value = action.reservation.carPlate;
                if (pickupForm) pickupForm.style.display = 'block';
            } else if (action.mode === 'return') {
                const carPlateElem = document.getElementById('return-car-plate');
                if (carPlateElem) carPlateElem.value = action.reservation.carPlate;
                if (returnForm) returnForm.style.display = 'block';
            }
        } catch (error) {
            console.error('Error in showActionForm:', error);
            showMessage(`前端 UI 錯誤: ${error.message}`, 'error');
        }
    }

    function renderActionList(actions) {
        if (infoPanel) infoPanel.style.display = 'none';
        if (selectionPanel) selectionPanel.style.display = 'block';
        if (actionListElem) actionListElem.innerHTML = '';
        actions.forEach((action, index) => {
            const button = document.createElement('button');
            const actionText = action.mode === 'pickup' ? '領車' : '還車';
            button.className = action.mode;
            button.innerHTML = `<strong>${actionText}</strong>：${action.reservation.carPlate}`;
            button.dataset.actionIndex = index;
            button.addEventListener('click', () => {
                const selectedIndex = parseInt(button.dataset.actionIndex, 10);
                const selectedAction = availableActions[selectedIndex];
                if (selectedAction) showActionForm(selectedAction);
            });
            if (actionListElem) actionListElem.appendChild(button);
        });
    }

    async function handleFormSubmit(e, formType) {
        e.preventDefault();
        if (!currentAction) {
            showMessage('發生錯誤：未選擇任何操作。', 'error');
            return;
        }
        const submitButton = e.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = '處理中...';
        }
        try {
            const mileage = document.getElementById(`${formType}-mileage`).value;
            if (!mileage) {
                alert('請務必輸入公里數！');
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = formType === 'pickup' ? '確認領車' : '確認還車';
                }
                return;
            }
            const params = {
                userId: liffProfile.userId,
                actionType: formType === 'pickup' ? '領車' : '還車',
                reservationId: currentAction.reservation.recordId,
                carPlate: currentAction.reservation.carPlate,
                mileage: mileage,
                notes: document.getElementById(`${formType}-notes`).value,
                gasFee: formType === 'return' ? (document.getElementById('return-gas-fee').value || '0') : ''
            };
            const result = await callGasApi('processCarAction', params);
            if (result.status === 'success') {
                showMessage(result.message, 'success');
                e.target.style.display = 'none';
                if (infoPanel) infoPanel.style.display = 'block';
                if (infoText) infoText.textContent = '操作完成！您可以關閉此頁面。';
                setTimeout(() => { if (liff.isInClient()) liff.closeWindow(); }, 3000);
            } else {
                throw new Error(result.message || '儲存失敗');
            }
        } catch (error) {
            showMessage(`前端錯誤: ${error.message}`, 'error');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = formType === 'pickup' ? '確認領車' : '確認還車';
            }
        }
    }

    try {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;
        const result = await callGasApi('getPickupReturnStatus', { userId: liffProfile.userId });
        if (result.status === 'actions_available' && Array.isArray(result.actions) && result.actions.length > 0) {
            availableActions = result.actions;
            renderActionList(availableActions);
        } else if (result.status === 'no_action') {
            if (infoText) infoText.textContent = result.message;
        } else {
            showMessage(result.message || '檢查狀態失敗', 'error');
        }
        if (pickupForm) pickupForm.addEventListener('submit', (e) => handleFormSubmit(e, 'pickup'));
        if (returnForm) returnForm.addEventListener('submit', (e) => handleFormSubmit(e, 'return'));
    } catch (e) {
        console.error("Action page initialization failed", e);
        showMessage("頁面初始化失敗", "error");
    }
}