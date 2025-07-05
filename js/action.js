// js/action.js (多動作處理版)

document.addEventListener('DOMContentLoaded', async () => {
    // === 全域變數 ===
    // 儲存從 LIFF SDK 獲取的使用者資訊
    let liffProfile = null; 
    // 儲存從後端 API 獲取的所有可執行動作的陣列
    let availableActions = []; 
    // 儲存使用者在選擇列表中，當前選擇要處理的那個動作物件
    let currentAction = null;  

    // === DOM 元素快取 ===
    // 為了效能，在程式開始時就先取得所有會用到的 HTML 元素
    const selectionPanel = document.getElementById('selection-panel');
    const actionListElem = document.getElementById('action-list');
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');
    const pickupForm = document.getElementById('pickup-form');
    const returnForm = document.getElementById('return-form');
    const messageBox = document.getElementById('message-box');

    /**
     * 在頁面上方顯示成功或失敗的訊息
     * @param {string} text - 要顯示的訊息文字
     * @param {string} type - 'success' 或 'error'
     */
    function showMessage(text, type) {
        messageBox.textContent = text;
        messageBox.className = `message ${type}`;
        messageBox.style.display = 'block';
    }

    /**
     * 步驟 2 的 UI 邏輯：根據使用者選擇的動作，顯示對應的表單
     * @param {object} action - 使用者選擇的那個動作物件
     */
    function showActionForm(action) {
        currentAction = action; // 非常重要：記錄下使用者當前要操作的對象
        selectionPanel.style.display = 'none'; // 隱藏選擇列表畫面

        if (action.mode === 'pickup') {
            document.getElementById('pickup-car-plate').value = action.reservation.carPlate;
            pickupForm.style.display = 'block';
        } else if (action.mode === 'return') {
            document.getElementById('return-car-plate').value = action.reservation.carPlate;
            returnForm.style.display = 'block';
        }
    }

    /**
     * 步驟 1 的 UI 邏輯：渲染從後端傳回來的動作列表
     * @param {Array<object>} actions - 包含所有可執行動作的陣列
     */
    function renderActionList(actions) {
        infoPanel.style.display = 'none'; // 隱藏「正在檢查...」的初始訊息
        selectionPanel.style.display = 'block'; // 顯示我們的選擇列表區塊
        actionListElem.innerHTML = ''; // 清空舊的按鈕，防止重複渲染

        actions.forEach((action, index) => {
            const button = document.createElement('button');
            const actionText = action.mode === 'pickup' ? '領車' : '還車';

            // 根據動作類型，給予不同的 CSS class (pickup 或 return)，用來顯示不同顏色
            button.className = action.mode; 
            button.innerHTML = `<strong>${actionText}</strong>：${action.reservation.carPlate}`;
            
            // 使用 data-* 屬性將這個動作在陣列中的索引存起來
            button.dataset.actionIndex = index;

            // 為每個按鈕綁定點擊事件
            button.addEventListener('click', () => {
                const selectedIndex = parseInt(button.dataset.actionIndex, 10);
                // 根據存起來的索引，從全域的 availableActions 陣列中找到對應的動作物件
                const selectedAction = availableActions[selectedIndex];
                showActionForm(selectedAction);
            });

            actionListElem.appendChild(button);
        });
    }

    /**
     * 頁面載入時的主要初始化函式
     */
    async function initializePage() {
        // 從 main.js 取得 LIFF Profile
        liffProfile = await initializeLiff();
        if (!liffProfile) return; // 如果初始化失敗或跳轉登入，則中止執行

        // 呼叫後端 API，取得所有可執行的動作
        const result = await callGasApi('getPickupReturnStatus', { userId: liffProfile.userId });
        
        // 根據後端回傳的 status 決定下一步
        if (result.status === 'actions_available' && result.actions.length > 0) {
            availableActions = result.actions; // 將後端傳來的動作陣列存到全域變數
            renderActionList(availableActions); // 呼叫函式去渲染選擇列表
        } else if (result.status === 'no_action') {
            infoText.textContent = result.message; // 顯示沒有可操作的項目
        } else {
            // 處理 API 可能回傳的錯誤
            showMessage(result.message || '檢查狀態失敗，請稍後再試。', 'error');
        }
    }
    
    /**
     * 處理領車或還車表單的提交事件
     * @param {Event} e - 表單提交事件物件
     * @param {string} formType - 'pickup' 或 'return'，用來區分是哪個表單
     */
    async function handleFormSubmit(e, formType) {
        e.preventDefault(); // 防止頁面刷新
        
        // 防呆：如果使用者還沒選擇任何動作就觸發了提交，則報錯
        if (!currentAction) {
            showMessage('發生錯誤：未選擇任何操作。', 'error');
            return;
        }

        try {
            const mileage = document.getElementById(`${formType}-mileage`).value;
            // 必填欄位檢查
            if (!mileage) {
                alert('請務必輸入公里數！');
                return;
            }

            // 組合要發送給後端的參數
            const params = {
                userId: liffProfile.userId,
                action: formType === 'pickup' ? '領車' : '還車', // 將前端的 formType 轉為後端要的中文
                reservationId: currentAction.reservation.recordId,
                carPlate: currentAction.reservation.carPlate,
                mileage: mileage,
                notes: document.getElementById(`${formType}-notes`).value,
                gasFee: formType === 'return' ? document.getElementById('return-gas-fee').value : ''
            };

            // 呼叫後端 API 寫入資料
            const result = await callGasApi('processCarAction', params);

            if (result.status === 'success') {
                showMessage(result.message, 'success');
                e.target.style.display = 'none'; // 隱藏剛剛提交的表單
                infoPanel.style.display = 'block';
                infoText.textContent = '操作完成！您可以關閉此頁面。';
                // 3秒後自動關閉 LIFF 視窗
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
    
    // === 事件綁定 ===
    // 為領車表單和還車表單分別綁定提交事件
    pickupForm.addEventListener('submit', (e) => handleFormSubmit(e, 'pickup'));
    returnForm.addEventListener('submit', (e) => handleFormSubmit(e, 'return'));

    // === 程式進入點 ===
    // 執行初始化函式，啟動整個頁面的邏輯
    initializePage();
});
