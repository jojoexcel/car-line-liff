/**
 * 檔案說明：領/還車頁面 (action.html) 的主要邏輯。
 * 核心功能：
 * 1. 配合新的後端 API，顯示所有「待領車」和「待還車」的選項。
 * 2. 提交時，傳送 `recordId` (LDR...) 給後端進行「更新」操作。
 * 版本：4.0 (配合後端重構版)
 */
async function initializeActionPage() {
    console.log("Initializing Action Page Logic (Refactored)...");

    // === DOM 元素快取 ===
    const selectionPanel = document.getElementById('selection-panel');
    const actionListElem = document.getElementById('action-list');
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');
    const pickupForm = document.getElementById('pickup-form');
    const returnForm = document.getElementById('return-form');

    // === 全域變數 ===
    let liffProfile = null;
    let availableActions = []; // 儲存從後端獲取的所有可執行動作
    let currentAction = null;  // 儲存使用者當前選擇的動作

    // === 權限與初始化 ===
    try {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;
    } catch (e) {
        console.error("Action page LIFF init failed", e);
        if (infoText) infoText.textContent = '頁面初始化失敗。';
        return;
    }

    // === 輔助函式 ===
    
   /**
     * 【新增】一個格式化日期的輔助函式
     */
    function formatDateTime(isoString) {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    /**
     * 【修改】根據使用者選擇的動作，顯示對應的表單並填入時間
     * @param {object} action - 使用者選擇的那個動作物件
     */
    function showActionForm(action) {
        currentAction = action;
        if (selectionPanel) selectionPanel.style.display = 'none';

        const startTime = formatDateTime(action.reservation.startTime);
        const endTime = formatDateTime(action.reservation.endTime);
        const timeText = `${startTime} ~ ${endTime}`;

        if (action.mode === 'pickup') {
            document.getElementById('pickup-car-plate').value = action.reservation.carPlate;
            // 【新增】將時間填入對應的 p 標籤
            document.getElementById('pickup-time-display').textContent = timeText;
            if (pickupForm) pickupForm.style.display = 'block';
        } else if (action.mode === 'return') {
            document.getElementById('return-car-plate').value = action.reservation.carPlate;
            // 【新增】將時間填入對應的 p 標籤
            document.getElementById('return-time-display').textContent = timeText;
            if (returnForm) returnForm.style.display = 'block';
        }
    }

    /**
     * 渲染從後端傳回來的動作列表
     * @param {Array<object>} actions - 包含所有可執行動作的陣列
     */
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
                if (selectedAction) {
                    showActionForm(selectedAction);
                }
            });
            if (actionListElem) actionListElem.appendChild(button);
        });
    }
    
    /**
     * 處理領車或還車表單的提交事件
     * @param {Event} e - 表單提交事件物件
     * @param {string} formType - 'pickup' 或 'return'
     */
    async function handleFormSubmit(e, formType) {
        e.preventDefault();
        if (!currentAction) {
            showModalAlert('發生錯誤：未選擇任何操作。', '錯誤');
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
                alert('請務必輸入公里數！'); // 這裡用原生 alert 快速提示
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = formType === 'pickup' ? '確認領車' : '確認還車';
                }
                return;
            }

            // 【關鍵修改】準備發送給後端的參數，現在包含了 recordId
            const params = {
                userId: liffProfile.userId,
                actionType: formType === 'pickup' ? '領車' : '還車',
                recordId: currentAction.reservation.recordId,       // 這是 LDR... 記錄ID
                reservationId: currentAction.reservation.reservationId, // 這是 R... 預約單號
                carPlate: currentAction.reservation.carPlate,
                mileage: mileage,
                notes: document.getElementById(`${formType}-notes`).value,
                gasFee: formType === 'return' ? (document.getElementById('return-gas-fee').value || '0') : ''
            };

            const result = await callGasApi('processCarAction', params);

            if (result.status === 'success') {
                showModalAlert(result.message);
                e.target.style.display = 'none';
                if (infoPanel) infoPanel.style.display = 'block';
                if (infoText) infoText.textContent = '操作完成！您可以關閉此頁面。';
                setTimeout(() => { if (liff.isInClient()) liff.closeWindow(); }, 3000);
            } else {
                throw new Error(result.message || '儲存失敗');
            }
        } catch (error) {
            showModalAlert(`前端錯誤: ${error.message}`, '錯誤');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = formType === 'pickup' ? '確認領車' : '確認還車';
            }
        }
    }

    // === 事件綁定 ===
    if (pickupForm) pickupForm.addEventListener('submit', (e) => handleFormSubmit(e, 'pickup'));
    if (returnForm) returnForm.addEventListener('submit', (e) => handleFormSubmit(e, 'return'));

    // === 程式進入點 ===
    async function loadInitialStatus() {
        const result = await callGasApi('getPickupReturnStatus', { userId: liffProfile.userId });
        if (result.status === 'actions_available' && Array.isArray(result.actions) && result.actions.length > 0) {
            availableActions = result.actions;
            renderActionList(availableActions);
        } else if (result.status === 'no_action') {
            if (infoText) infoText.textContent = result.message;
        } else {
            showModalAlert(result.message || '檢查狀態失敗', '錯誤');
        }
    }
    
    // 執行載入
    loadInitialStatus();
}
